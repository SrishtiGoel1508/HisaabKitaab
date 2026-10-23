import os
from typing import List, Optional, Literal

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from google import genai
from google.genai import types

from pydantic import BaseModel, Field


app = FastAPI(title="HisaabKitaab Receipt AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Gemini API key comes from your environment variable
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set.")

client = genai.Client(api_key=api_key)


# -----------------------------
# Receipt data structure
# -----------------------------

class ReceiptItem(BaseModel):
    name: Optional[str] = Field(
        default=None,
        description="Name of the item. Null if missing or unreadable."
    )

    quantity: Optional[float] = Field(
        default=None,
        description="Quantity written on the receipt."
    )

    price: Optional[float] = Field(
        default=None,
        description="Unit price/rate written on the receipt."
    )

    amount: Optional[float] = Field(
        default=None,
        description="Line-item amount written on the receipt."
    )


class ReceiptData(BaseModel):
    vendor: Optional[str] = None

    date: Optional[str] = None

    items: List[ReceiptItem] = Field(default_factory=list)

    subtotal: Optional[float] = None

    total: Optional[float] = None

    category: Optional[
        Literal[
            "Food",
            "Transport",
            "Office Supplies",
            "Utilities",
            "Other"
        ]
    ] = None

    unclear_fields: List[str] = Field(default_factory=list)


# -----------------------------
# Gemini instructions
# -----------------------------

SYSTEM_INSTRUCTION = """
You are the receipt-reading AI for HisaabKitaab.

Your ONLY job is to read ONE uploaded receipt and extract
information that is actually visible.

STRICT RULES:

1. Extract:
   - vendor
   - date
   - items
   - quantity
   - unit price/rate
   - line-item amount
   - subtotal
   - final total

2. Extract exactly what is visibly written.

3. NEVER guess missing or unreadable information.

4. If a field is missing, blurry, cut off, crossed out,
   or impossible to read:
   - return null for that field
   - add the field name to "unclear_fields"

5. For handwritten receipts, carefully distinguish
   similar-looking digits such as:
   0, 5, 6, 8 and 9.

6. DO NOT correct the receipt.

   Example:
   If the receipt says:
       Subtotal = 470

   but the visible item amounts add up to:
       630

   keep subtotal as 470.
   Do NOT replace 470 with 630.

7. If visible amounts do not mathematically agree,
   add:
       "arithmetic_inconsistency"
   to "unclear_fields".

8. Extract the final total exactly as written.
   Do NOT calculate a replacement total.

9. NEVER infer a missing date from:
   - today's date
   - filename
   - upload date
   - bill number
   - surrounding context

10. Suggest ONE category only from:
    Food
    Transport
    Office Supplies
    Utilities
    Other

11. Only assign a category when there is enough visible
    evidence. Otherwise return null.

12. Prices and amounts must be numbers only.
    Do not include currency symbols.

13. Treat the uploaded file as ONE receipt.

14. Do NOT provide:
    - explanations
    - summaries
    - verification reports
    - accuracy assessments
    - markdown

15. Return ONLY structured data matching the schema.
"""


# -----------------------------
# Receipt extraction endpoint
# -----------------------------

@app.post("/api/extract-receipt", response_model=ReceiptData)
async def extract_receipt(file: UploadFile = File(...)):

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a JPEG, PNG, WEBP, or PDF receipt."
        )

    try:
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        receipt_part = types.Part.from_bytes(
            data=file_bytes,
            mime_type=file.content_type
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                receipt_part,
                "Extract this ONE receipt according to the instructions."
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=ReceiptData,
                temperature=0.0
            )
        )

        receipt = ReceiptData.model_validate_json(response.text)

        return receipt

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Receipt extraction failed: {str(e)}"
        )


# -----------------------------
# Run server
# -----------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )