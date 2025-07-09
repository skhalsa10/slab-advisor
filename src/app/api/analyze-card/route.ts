import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase-server";
import { checkUserCredits, deductUserCredits } from "@/utils/credits";
import { CREDIT_COSTS, HTTP_STATUS, ERROR_MESSAGES, XIMILAR_API } from "@/constants/constants";
import { XimilarApiResponse, CardRecord } from "@/types/ximilar";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication and get Supabase client
    const { user, error: authError, supabase } = await getServerSession(request);

    if (authError || !user || !supabase) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // 2. Validate request body
    const { cardId } = await request.json();
    if (!cardId || typeof cardId !== "string") {
      return NextResponse.json(
        { error: "Valid card ID is required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 3. Check user credits before proceeding
    const creditCheck = await checkUserCredits(supabase, user.id, 1);
    
    if (!creditCheck.hasCredits) {
      return NextResponse.json(
        {
          error:
            creditCheck.creditsRemaining === 0
              ? "No credits remaining. Please purchase more credits to analyze cards."
              : creditCheck.error || "Unable to verify credits.",
          success: false,
        },
        { status: HTTP_STATUS.PAYMENT_REQUIRED }
      );
    }

    // 4. Get card data and verify ownership
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .eq("user_id", user.id) // Ensure user owns this card
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (!card.front_image_url || !card.back_image_url) {
      return NextResponse.json(
        { error: "Card images not found" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Test if URLs are publicly accessible
    try {
      const frontCheck = await fetch(card.front_image_url, { method: "HEAD" });
      const backCheck = await fetch(card.back_image_url, { method: "HEAD" });

      console.log("Front image accessible:", frontCheck.ok, frontCheck.status);
      console.log("Back image accessible:", backCheck.ok, backCheck.status);

      if (!frontCheck.ok || !backCheck.ok) {
        return NextResponse.json(
          {
            error:
              "Card images are not publicly accessible. Please try uploading again.",
            success: false,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    } catch (urlError) {
      console.error("Error checking image URLs:", urlError);
    }

    // Prepare payloads for both APIs
    const gradePayload = {
      records: [
        {
          _url: card.front_image_url,
          side: "front",
        },
        {
          _url: card.back_image_url,
          side: "back",
        },
      ],
    };

    const analyzePayload = {
      records: [
        {
          _url: card.front_image_url,
        },
      ],
    };

    console.log(
      "Sending to Ximilar Grade API:",
      JSON.stringify(gradePayload, null, 2)
    );
    console.log(
      "Sending to Ximilar Analyze API:",
      JSON.stringify(analyzePayload, null, 2)
    );

    // Call both APIs in parallel
    const [gradeResponse, analyzeResponse] = await Promise.all([
      // Grade API call
      fetch(XIMILAR_API.GRADE_URL, {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.XIMILAR_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gradePayload),
      }),
      // Analyze API call
      fetch(XIMILAR_API.ANALYZE_URL, {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.XIMILAR_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analyzePayload),
      }),
    ]);

    // Log response details
    console.log("Grade API Response Status:", gradeResponse.status);
    console.log("Analyze API Response Status:", analyzeResponse.status);

    // Process both responses
    const gradeResponseText = await gradeResponse.text();
    const analyzeResponseText = await analyzeResponse.text();

    console.log("Raw Grade response:", gradeResponseText);
    console.log("Raw Analyze response:", analyzeResponseText);

    let gradeResult: XimilarApiResponse;
    let analyzeResult: XimilarApiResponse | null;

    try {
      gradeResult = JSON.parse(gradeResponseText) as XimilarApiResponse;
      console.log(
        "Parsed Grade response:",
        JSON.stringify(gradeResult, null, 2)
      );
    } catch (parseError) {
      console.error("Failed to parse Grade response as JSON:", parseError);
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.ANALYSIS_FAILED,
          success: false,
        },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    try {
      analyzeResult = JSON.parse(analyzeResponseText) as XimilarApiResponse;
      console.log(
        "Parsed Analyze response:",
        JSON.stringify(analyzeResult, null, 2)
      );
    } catch (parseError) {
      console.error("Failed to parse Analyze response as JSON:", parseError);
      // Don't fail the entire request if analyze fails
      analyzeResult = null;
    }

    // Check if we have valid grading data
    if (!gradeResult.records || gradeResult.records.length === 0) {
      console.error("No records in Grade response");
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.ANALYSIS_FAILED,
          success: false,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if we have grading data
    const hasValidGrades = gradeResult.records.some(
      (r) => r.grades && r.grades.final
    );
    if (!hasValidGrades) {
      console.error("No valid grades found in Grade response");
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.GRADING_FAILED,
          success: false,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Log that we're proceeding despite potential status issues
    if (!gradeResponse.ok) {
      console.warn(
        `Grade API returned status ${gradeResponse.status} but has valid grading data - proceeding`
      );
    }

    // Process Grade results with complete response storage
    // Extract results for analysis (using side field)
    const frontResult = gradeResult.records.find(
      (r) => r.side === "front"
    );
    const backResult = gradeResult.records.find(
      (r) => r.side === "back"
    );

    // Check for card detection errors
    if (
      frontResult?._status?.code === 400 ||
      backResult?._status?.code === 400
    ) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.CARD_DETECTION_FAILED,
          success: false,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Use Ximilar's final grade calculation (they handle sophisticated weighting/rounding)
    const estimatedGrade = frontResult?.grades?.final || backResult?.grades?.final || null;
    const confidence = estimatedGrade ? 0.95 : null;

    // Store calculation details for transparency
    const frontGrade = frontResult?.grades?.final;
    const backGrade = backResult?.grades?.final;

    const weightedCalculation = {
      front_grade: frontGrade,
      back_grade: backGrade,
      ximilar_final_grade: estimatedGrade,
      note: "Using Ximilar's sophisticated grading algorithm with professional weighting",
    };

    // Process analyze results for card identification
    let cardIdentification = null;
    let analyzeDetails = null;

    if (
      analyzeResult &&
      analyzeResult.records &&
      analyzeResult.records.length > 0
    ) {
      analyzeDetails = analyzeResult;
      const firstRecord = analyzeResult.records[0];
      const cardObject = firstRecord._objects?.find(
        (obj) => obj.name === "Card"
      );

      if (
        cardObject &&
        cardObject._identification &&
        (cardObject._identification as any).best_match
      ) {
        const bestMatch = (cardObject._identification as any).best_match;
        cardIdentification = {
          card_set: bestMatch.set || null,
          rarity: bestMatch.rarity || null,
          full_name: bestMatch.full_name || null,
          out_of: bestMatch.out_of || null,
          card_number: bestMatch.card_number || null,
          set_series_code: bestMatch.set_series_code || null,
          set_code: bestMatch.set_code || null,
          series: bestMatch.series || null,
          year: bestMatch.year || null,
          subcategory: bestMatch.subcategory || null,
          links: bestMatch.links || null,
        };
      }
    }

    // Download and store overlay images
    const overlayUrls = {
      front_full_overlay_url: null as string | null,
      front_exact_overlay_url: null as string | null,
      back_full_overlay_url: null as string | null,
      back_exact_overlay_url: null as string | null,
    };

    try {
      // Download overlay images if available
      if (frontResult?._full_url_card) {
        const frontFullResponse = await fetch(frontResult._full_url_card);
        if (frontFullResponse.ok) {
          const frontFullBuffer = await frontFullResponse.arrayBuffer();
          const frontFullFileName = `${user.id}/${cardId}/front_full.webp`;

          const { error: frontFullError } = await supabase.storage
            .from("card-images")
            .upload(frontFullFileName, frontFullBuffer, {
              contentType: "image/webp",
              upsert: true,
            });

          if (!frontFullError) {
            const { data: frontFullUrl } = supabase.storage
              .from("card-images")
              .getPublicUrl(frontFullFileName);
            overlayUrls.front_full_overlay_url = frontFullUrl.publicUrl;
          }
        }
      }

      if (frontResult?._exact_url_card) {
        const frontExactResponse = await fetch(frontResult._exact_url_card);
        if (frontExactResponse.ok) {
          const frontExactBuffer = await frontExactResponse.arrayBuffer();
          const frontExactFileName = `${user.id}/${cardId}/front_exact.webp`;

          const { error: frontExactError } = await supabase.storage
            .from("card-images")
            .upload(frontExactFileName, frontExactBuffer, {
              contentType: "image/webp",
              upsert: true,
            });

          if (!frontExactError) {
            const { data: frontExactUrl } = supabase.storage
              .from("card-images")
              .getPublicUrl(frontExactFileName);
            overlayUrls.front_exact_overlay_url = frontExactUrl.publicUrl;
          }
        }
      }

      if (backResult?._full_url_card) {
        const backFullResponse = await fetch(backResult._full_url_card);
        if (backFullResponse.ok) {
          const backFullBuffer = await backFullResponse.arrayBuffer();
          const backFullFileName = `${user.id}/${cardId}/back_full.webp`;

          const { error: backFullError } = await supabase.storage
            .from("card-images")
            .upload(backFullFileName, backFullBuffer, {
              contentType: "image/webp",
              upsert: true,
            });

          if (!backFullError) {
            const { data: backFullUrl } = supabase.storage
              .from("card-images")
              .getPublicUrl(backFullFileName);
            overlayUrls.back_full_overlay_url = backFullUrl.publicUrl;
          }
        }
      }

      if (backResult?._exact_url_card) {
        const backExactResponse = await fetch(backResult._exact_url_card);
        if (backExactResponse.ok) {
          const backExactBuffer = await backExactResponse.arrayBuffer();
          const backExactFileName = `${user.id}/${cardId}/back_exact.webp`;

          const { error: backExactError } = await supabase.storage
            .from("card-images")
            .upload(backExactFileName, backExactBuffer, {
              contentType: "image/webp",
              upsert: true,
            });

          if (!backExactError) {
            const { data: backExactUrl } = supabase.storage
              .from("card-images")
              .getPublicUrl(backExactFileName);
            overlayUrls.back_exact_overlay_url = backExactUrl.publicUrl;
          }
        }
      }

      console.log("Overlay images processed:", overlayUrls);
    } catch (overlayError) {
      console.error("Error downloading overlay images:", overlayError);
      // Continue without overlay images - this is not a critical error
    }

    // Store complete response with our metadata
    const gradingDetails = {
      ximilar_response: gradeResult, // Store complete grading API response
      weighted_calculation: weightedCalculation,
      metadata: {
        analysis_date: new Date().toISOString(),
        api_version: "card-grader/v2/grade",
        credit_count: 1, // This request counts as 1 credit
        processing_time: gradeResult.statistics?.["processing time"] || null,
      },
    };

    // Update card record with grading results, overlay URLs, and identification data
    const updateData: Record<string, unknown> = {
      estimated_grade: estimatedGrade,
      confidence: confidence,
      grading_details: gradingDetails,
      front_full_overlay_url: overlayUrls.front_full_overlay_url,
      front_exact_overlay_url: overlayUrls.front_exact_overlay_url,
      back_full_overlay_url: overlayUrls.back_full_overlay_url,
      back_exact_overlay_url: overlayUrls.back_exact_overlay_url,
      updated_at: new Date().toISOString(),
    };

    // Add card identification fields if available
    if (cardIdentification) {
      updateData.card_title = cardIdentification.full_name || card.card_title;
      updateData.card_set = cardIdentification.card_set;
      updateData.rarity = cardIdentification.rarity;
      updateData.out_of = cardIdentification.out_of;
      updateData.card_number = cardIdentification.card_number;
      updateData.set_series_code = cardIdentification.set_series_code;
      updateData.set_code = cardIdentification.set_code;
      updateData.series = cardIdentification.series;
      updateData.year = cardIdentification.year;
      updateData.subcategory = cardIdentification.subcategory;
      updateData.links = cardIdentification.links;
    }

    // Store analyze details if available
    if (analyzeDetails) {
      updateData.analyze_details = analyzeDetails;
    }

    const { error: updateError } = await supabase
      .from("cards")
      .update(updateData)
      .eq("id", cardId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save analysis results" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // 5. Deduct credit only after successful analysis and database update
    const deductResult = await deductUserCredits(supabase, user.id, 1);
    
    if (!deductResult.success) {
      console.error("Credit deduction failed:", deductResult.error);
      // Analysis was successful but credit deduction failed - log but don't fail the request
    }

    return NextResponse.json({
      success: true,
      cardId,
      estimatedGrade,
      confidence,
      gradingDetails,
      cardIdentification,
      analyzeSuccess: cardIdentification !== null,
      analyzeMessage:
        cardIdentification === null && analyzeResult !== null
          ? "Unable to identify card. Please enter details manually."
          : null,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error during card analysis",
        success: false,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
