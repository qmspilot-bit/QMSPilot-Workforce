import DailyOperationsApp from "@/components/daily-operations-app";
import styles from "./daily-operations.module.css";

export default function DailyOperationsPage() {
  return (
    <div className={styles.scope}>
      <DailyOperationsApp />
    </div>
  );
}
