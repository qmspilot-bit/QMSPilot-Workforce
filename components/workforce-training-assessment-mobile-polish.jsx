"use client";

export default function WorkforceTrainingAssessmentMobilePolish() {
  return (
    <style>{`
      /* Training Assessment control polish: preserve workflow, improve scale and touch ergonomics. */
      .nsa-config .nsa-toggle {
        min-height: 64px;
        justify-content: flex-start;
        gap: 10px;
        padding: 12px;
      }

      .nsa-toggle input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
        margin: 0;
        display: grid;
        place-content: center;
        border: 1.5px solid #9db3c4;
        border-radius: 5px;
        background: #fff;
        cursor: pointer;
        transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
      }

      .nsa-toggle input[type="checkbox"]::after {
        content: "";
        width: 5px;
        height: 10px;
        border: solid #fff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transform-origin: center;
        transition: transform .12s ease;
        margin-top: -2px;
      }

      .nsa-toggle input[type="checkbox"]:checked {
        border-color: #0a66b7;
        background: #0a66b7;
      }

      .nsa-toggle input[type="checkbox"]:checked::after {
        transform: rotate(45deg) scale(1);
      }

      .nsa-toggle input[type="checkbox"]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(10, 102, 183, .18);
      }

      .nsa-toggle > span {
        line-height: 1.35;
      }

      @media (max-width: 900px) {
        .nsa-config {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .nsa-config .nsa-toggle {
          min-height: 58px;
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

        .nsa-config {
          grid-template-columns: 1fr;
          gap: 9px;
          margin-top: 12px;
        }

        .nsa-config label:not(.nsa-toggle) {
          gap: 6px;
        }

        .nsa-config input[type="number"] {
          min-height: 44px;
          font-size: 14px;
        }

        .nsa-config .nsa-toggle {
          min-height: 52px;
          padding: 10px 12px;
          gap: 11px;
        }

        .nsa-toggle input[type="checkbox"] {
          width: 18px;
          height: 18px;
          min-width: 18px;
          min-height: 18px;
        }

        .nsa-toggle input[type="checkbox"]::after {
          width: 4px;
          height: 9px;
        }

        .nsa-toggle > span {
          font-size: 12px;
        }

        .nsa-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .nsa-actions button.primary {
          min-height: 44px;
          justify-content: center;
        }

        .nsa-actions .nsa-badge {
          align-self: flex-start;
        }
      }
    `}</style>
  );
}
