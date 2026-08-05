import DeliveryAssuranceAccountStatus from "@/components/delivery-assurance-account-status";
import DeliveryAssuranceApp from "@/components/delivery-assurance-app";
import DeliveryAssuranceSync from "@/components/delivery-assurance-sync";

export default function DeliveryAssurancePage() {
  return (
    <>
      <DeliveryAssuranceAccountStatus />
      <DeliveryAssuranceSync />
      <DeliveryAssuranceApp />
    </>
  );
}
