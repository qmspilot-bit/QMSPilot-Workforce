import WorkforceReadinessApp from "@/components/workforce-readiness-app";
import WorkforceReadinessExperienceEnhancer from "@/components/workforce-readiness-experience-enhancer";
import WorkforceTrainingAssessmentEnhancer from "@/components/workforce-training-assessment-enhancer";
import WorkforceTrainingAssessmentMobilePolish from "@/components/workforce-training-assessment-mobile-polish";
import WorkforceStepAttachmentsEnhancer from "@/components/workforce-step-attachments-enhancer";
import { WorkforceHomeNavigation } from "@/components/workforce-home-navigation";

export default function WorkforceReadinessPage() {
  return (
    <>
      <WorkforceReadinessApp />
      <WorkforceHomeNavigation />
      <WorkforceReadinessExperienceEnhancer />
      <WorkforceTrainingAssessmentEnhancer />
      <WorkforceTrainingAssessmentMobilePolish />
      <WorkforceStepAttachmentsEnhancer />
    </>
  );
}
