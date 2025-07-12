import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase-server";
import { checkUserCredits, deductUserCredits } from "@/utils/credits";
import { HTTP_STATUS } from "@/constants/constants";
import {
  validateCardAccess,
  validateImageAccess,
  callXimilarAPIs,
  processXimilarResponses,
  validateGradingResults,
  extractCardIdentification,
  calculateFinalGrade,
  downloadOverlayImages,
  updateCardWithResults
} from "@/utils/cardAnalysis";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication and request validation
    const { user, error: authError, supabase } = await getServerSession(request);
    if (authError || !user || !supabase) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { cardId } = await request.json();
    if (!cardId || typeof cardId !== "string") {
      return NextResponse.json(
        { error: "Valid card ID is required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 2. Check user credits
    const creditCheck = await checkUserCredits(supabase, user.id, 1);
    if (!creditCheck.hasCredits) {
      return NextResponse.json(
        {
          error: creditCheck.creditsRemaining === 0
            ? "No credits remaining. Please purchase more credits to analyze cards."
            : creditCheck.error || "Unable to verify credits.",
          success: false,
        },
        { status: HTTP_STATUS.PAYMENT_REQUIRED }
      );
    }

    // 3. Validate card access and ownership
    const cardValidation = await validateCardAccess(supabase, user.id, cardId);
    if (!cardValidation.success) {
      return NextResponse.json(
        { error: cardValidation.error },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    const { card } = cardValidation;

    // 4. Validate image accessibility
    const imagesAccessible = await validateImageAccess(card!);
    if (!imagesAccessible) {
      return NextResponse.json(
        {
          error: "Card images are not publicly accessible. Please try uploading again.",
          success: false,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 5. Call Ximilar APIs
    const { gradeResponse, analyzeResponse } = await callXimilarAPIs(card!);

    // 6. Process API responses
    const { gradeResult, analyzeResult } = await processXimilarResponses(
      gradeResponse,
      analyzeResponse
    );

    // 7. Validate grading results
    validateGradingResults(gradeResult);

    // 8. Extract analysis data
    const cardIdentification = extractCardIdentification(analyzeResult);
    const { estimatedGrade, confidence, gradingDetails } = calculateFinalGrade(gradeResult);

    // 9. Download overlay images
    const overlayUrls = await downloadOverlayImages(
      supabase,
      gradeResult,
      user.id,
      cardId
    );

    // 10. Update card with results
    await updateCardWithResults(supabase, cardId, {
      estimatedGrade,
      confidence,
      gradingDetails,
      cardIdentification,
      overlayUrls,
      analyzeDetails: analyzeResult
    });

    // 11. Deduct credit
    const deductResult = await deductUserCredits(supabase, user.id);
    if (!deductResult.success) {
      // Analysis was successful but credit deduction failed - continue anyway
    }

    return NextResponse.json({
      success: true,
      cardId,
      estimatedGrade,
      confidence,
      gradingDetails,
      cardIdentification,
      analyzeSuccess: cardIdentification !== null,
      analyzeMessage: cardIdentification === null && analyzeResult !== null
        ? "Unable to identify card. Please enter details manually."
        : null,
    });
  } catch (error) {
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
