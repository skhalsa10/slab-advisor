import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getServerSession,
} from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const { user, error: authError } = await getServerSession(request);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create server-side Supabase client with service role
    const supabase = await createServerSupabaseClient();

    // 2. Validate request body
    const { cardId } = await request.json();
    if (!cardId || typeof cardId !== "string") {
      return NextResponse.json(
        { error: "Valid card ID is required" },
        { status: 400 }
      );
    }

    // 3. Check user credits before proceeding
    const { data: creditData, error: creditError } = await supabase
      .from("user_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .single();

    if (creditError || !creditData || creditData.credits_remaining <= 0) {
      return NextResponse.json(
        {
          error:
            "No credits remaining. Please purchase more credits to analyze cards.",
          success: false,
        },
        { status: 402 }
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
        { status: 400 }
      );
    }

    // Log URLs to verify they're accessible
    console.log("Image URLs being sent to Ximilar:");
    console.log("Front:", card.front_image_url);
    console.log("Back:", card.back_image_url);

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
          { status: 400 }
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
      fetch("https://api.ximilar.com/card-grader/v2/grade", {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.XIMILAR_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gradePayload),
      }),
      // Analyze API call
      fetch("https://api.ximilar.com/collectibles/v2/analyze", {
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

    let gradeResult: Record<string, unknown>;
    let analyzeResult: Record<string, unknown> | null;

    try {
      gradeResult = JSON.parse(gradeResponseText);
      console.log(
        "Parsed Grade response:",
        JSON.stringify(gradeResult, null, 2)
      );
    } catch (parseError) {
      console.error("Failed to parse Grade response as JSON:", parseError);
      return NextResponse.json(
        {
          error: "Invalid response from grading service.",
          success: false,
        },
        { status: 500 }
      );
    }

    try {
      analyzeResult = JSON.parse(analyzeResponseText);
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
          error:
            "Unable to analyze card. Please ensure images are clear and well-lit.",
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if we have grading data
    const hasValidGrades = (gradeResult.records as Array<Record<string, unknown>>).some(
      (r: Record<string, unknown>) => r.grades && (r.grades as Record<string, unknown>).final
    );
    if (!hasValidGrades) {
      console.error("No valid grades found in Grade response");
      return NextResponse.json(
        {
          error: "Unable to grade card. Please check image quality.",
          success: false,
        },
        { status: 400 }
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
      (r: { side: string }) => r.side === "front"
    );
    const backResult = gradeResult.records.find(
      (r: { side: string }) => r.side === "back"
    );

    // Check for card detection errors
    if (
      frontResult?._status?.code === 400 ||
      backResult?._status?.code === 400
    ) {
      return NextResponse.json(
        {
          error:
            "Could not detect a trading card in the image. Please ensure:\n• The card is clearly visible and fills most of the frame\n• Good lighting without glare or shadows\n• Card is flat and not at an extreme angle\n• Background contrasts with the card",
          success: false,
        },
        { status: 400 }
      );
    }

    // Use Ximilar's final grade calculation (they handle sophisticated weighting/rounding)
    const estimatedGrade = gradeResult.grades?.final || null;
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
      const cardObject = (firstRecord._objects as Array<Record<string, unknown>>)?.find(
        (obj: Record<string, unknown>) => obj.name === "Card"
      );

      if (
        cardObject &&
        cardObject._identification &&
        cardObject._identification.best_match
      ) {
        const bestMatch = cardObject._identification.best_match;
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
      front_full_overlay_url: null,
      front_exact_overlay_url: null,
      back_full_overlay_url: null,
      back_exact_overlay_url: null,
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
        { status: 500 }
      );
    }

    // 5. Deduct credit only after successful analysis and database update
    const { error: deductError } = await supabase.rpc("deduct_user_credit", {
      user_id: user.id,
    });

    if (deductError) {
      console.error("Credit deduction error:", deductError);
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
      { status: 500 }
    );
  }
}
