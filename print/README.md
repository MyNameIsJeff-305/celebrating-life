# Print source

PDFs are design proofs until the custom domain and both QR routes are live. See ../docs/LAUNCH.md for dimensions, bleed, color and bottle test requirements.

To regenerate: install Python reportlab and pypdf, then run `python scripts/create-label.py` from this print directory. Font files, their licenses and QR matrices are included. Output: two PDFs with embedded type and vector QR modules. QR matrices encode the permanent Spanish and English URLs.
