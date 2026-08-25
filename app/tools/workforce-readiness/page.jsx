import WorkforceReadinessApp from "@/components/workforce-readiness-app";
import WorkforceReadinessExperienceEnhancer from "@/components/workforce-readiness-experience-enhancer";
import WorkforceTrainingAssessmentEnhancer from "@/components/workforce-training-assessment-enhancer";
import WorkforceTrainingAssessmentMobilePolish from "@/components/workforce-training-assessment-mobile-polish";

export default function WorkforceReadinessPage() {
  return (
    <>
      <WorkforceReadinessApp />
      <WorkforceReadinessExperienceEnhancer />
      <WorkforceTrainingAssessmentEnhancer />
      <WorkforceTrainingAssessmentMobilePolish />
    </>
  );
}
