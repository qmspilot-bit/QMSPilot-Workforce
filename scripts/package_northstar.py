from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "scenarios" / "northstar"
EVAL = ROOT / "evals" / "northstar"

FILES = [
    ("00_Northstar_Scenario_Brief.pdf", "scenario instructions"),
    ("01_Company_and_QMS_Profile.pdf", "company and QMS context"),
    ("02_NPS-PR-004_Document_Control.docx", "controlled procedure"),
    ("03_IA-2026-02_Internal_Audit_Report.pdf", "internal audit evidence"),
    ("04_CAPA_Action_Register.xlsx", "corrective-action register"),
    ("05_Management_Review_Minutes_2026-06.docx", "management review evidence"),
    ("06_Training_Matrix.xlsx", "competence evidence"),
    ("07_PM_and_Calibration_Records.xlsx", "maintenance and calibration evidence"),
    ("08_SCAR-2026-007_Supplier_Nonconformance.pdf", "supplier corrective-action evidence"),
    ("09_CC-2026-014_Customer_Complaint.pdf", "customer complaint evidence"),
    ("10_Clean_Evidence_Packet.pdf", "negative controls"),
    ("README.txt", "pack instructions"),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    missing = [name for name, _ in FILES if not (PUBLIC / name).exists()]
    if missing:
        raise SystemExit(f"Missing Northstar source files: {', '.join(missing)}")

    manifest = {
        "scenario_id": "northstar-audit-readiness-2026-07",
        "version": "1.0.0",
        "synthetic": True,
        "files": [
            {
                "name": name,
                "role": role,
                "bytes": (PUBLIC / name).stat().st_size,
                "sha256": sha256(PUBLIC / name),
            }
            for name, role in FILES
        ],
    }
    (EVAL / "source-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    archive = PUBLIC / "northstar-evidence-pack.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, _ in FILES:
            bundle.write(PUBLIC / name, arcname=name)
    print(f"Wrote {archive.relative_to(ROOT)} ({archive.stat().st_size} bytes)")
    print(f"Wrote {(EVAL / 'source-manifest.json').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
