import WorkforceReadinessApp from "@/components/workforce-readiness-app";
import WorkforceReadinessExperienceEnhancer from "@/components/workforce-readiness-experience-enhancer";
import WorkforceTrainingAssessmentEnhancer from "@/components/workforce-training-assessment-enhancer";

export default function WorkforceReadinessPage() {
  return (
    <>
      <WorkforceReadinessApp />
      <WorkforceReadinessExperienceEnhancer />
      <WorkforceTrainingAssessmentEnhancer />
    </>
  );
}
