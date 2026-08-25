"use client";

export default function WorkforceTrainingAssessmentMobilePolish() {
  return (
    <style>{`
      /* Enterprise assessment configuration surface. Workflow is unchanged. */
      .nsa-card:not(.nsa-training) .nsa-config {
        display: grid;
        grid-template-columns: 1.05fr 1.05fr 1.45fr 1.2fr 1.55fr;
        gap: 10px;
        align-items: stretch;
        margin-top: 14px;
        padding: 14px;
        border: 1px solid #dce5ec;
        border-radius: 10px;
        background: #f7f9fb;
      }

      .nsa-card:not(.nsa-training) .nsa-config::before {
        content: "ASSESSMENT CONFIGURATION";
        grid-column: 1 / -1;
        display: block;
        margin-bottom: 1px;
        color: #536d81;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .12em;
      }

      .nsa-card:not(.nsa-training) .nsa-config > label {
        min-width: 0;
        min-height: 76px;
        box-sizing: border-box;
        padding: 11px 12px;
        border: 1px solid #d7e1e8;
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(20,48,72,.025);
      }

      .nsa-card:not(.nsa-training) .nsa-config > label:not(.nsa-toggle) {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
        color: #506b80;
        font-size: 8px;
        font-weight: 900;
      }

      .nsa-card:not(.nsa-training) .nsa-config input[type="number"] {
        width: 100%;
        min-height: 34px;
        box-sizing: border-box;
        padding: 0 10px;
        border: 1px solid #cbd8e2;
        border-radius: 6px;
        background: #fbfcfd;
        color: #17364f;
        font-weight: 900;
        outline: none;
      }

      .nsa-card:not(.nsa-training) .nsa-config input[type="number"]:focus {
        border-color: #0a66b7;
        box-shadow: 0 0 0 3px rgba(10,102,183,.10);
        background: #fff;
      }

      /* Boolean settings are compact enterprise switch cards, not empty input boxes. */
      .nsa-card:not(.nsa-training) .nsa-config .nsa-toggle {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px;
        padding: 11px 12px;
        border: 1px solid #d7e1e8;
        border-radius: 8px;
        background: #fff;
      }

      .nsa-card:not(.nsa-training) .nsa-toggle > span {
        order: 0;
        color: #29485f;
        font-size: 8px;
        font-weight: 900;
        line-height: 1.35;
      }

      .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        order: 1;
        flex: 0 0 auto;
        position: relative;
        width: 36px;
        height: 20px;
        min-width: 36px;
        min-height: 20px;
        margin: 0;
        border: 1px solid #aebfcb;
        border-radius: 999px;
        background: #d8e1e8;
        cursor: pointer;
        transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
      }

      .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"]::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        border: 0;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(20,48,72,.22);
        transform: none;
        transition: left .15s ease;
      }

      .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"]:checked {
        border-color: #0a66b7;
        background: #0a66b7;
      }

      .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"]:checked::after {
        left: 18px;
        transform: none;
      }

      .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(10,102,183,.16);
      }

      /* Remove the redundant status pill and give the primary action its own footer zone. */
      .nsa-card:not(.nsa-training) .nsa-actions > .nsa-badge {
        display: none;
      }

      .nsa-card:not(.nsa-training) .nsa-actions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e2e9ee;
      }

      .nsa-card:not(.nsa-training) .nsa-actions button.primary {
        min-height: 38px;
        padding: 0 14px;
        border-radius: 7px;
        box-shadow: 0 2px 5px rgba(10,102,183,.14);
      }

      @media (max-width: 1100px) {
        .nsa-card:not(.nsa-training) .nsa-config {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .nsa-card:not(.nsa-training) .nsa-config::before {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 620px) {
        .nsa-card {
          padding: 14px;
        }

        .nsa-heading {
          gap: 12px;
        }

        .nsa-heading > svg {
          flex: 0 0 auto;
        }

        .nsa-card:not(.nsa-training) .nsa-config {
          grid-template-columns: 1fr;
          gap: 9px;
          margin-top: 12px;
          padding: 11px;
        }

        .nsa-card:not(.nsa-training) .nsa-config::before {
          grid-column: 1;
          margin-bottom: 0;
          font-size: 8px;
        }

        .nsa-card:not(.nsa-training) .nsa-config > label {
          min-height: 64px;
          padding: 10px 11px;
        }

        .nsa-card:not(.nsa-training) .nsa-config > label:not(.nsa-toggle) {
          font-size: 11px;
        }

        .nsa-card:not(.nsa-training) .nsa-config input[type="number"] {
          min-height: 42px;
          font-size: 14px;
        }

        .nsa-card:not(.nsa-training) .nsa-toggle > span {
          font-size: 11px;
        }

        .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"] {
          width: 40px;
          min-width: 40px;
          height: 22px;
          min-height: 22px;
        }

        .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"]::after {
          width: 16px;
          height: 16px;
        }

        .nsa-card:not(.nsa-training) .nsa-toggle input[type="checkbox"]:checked::after {
          left: 20px;
        }

        .nsa-card:not(.nsa-training) .nsa-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .nsa-card:not(.nsa-training) .nsa-actions button.primary {
          min-height: 44px;
          justify-content: center;
        }
      }
    `}</style>
  );
}
