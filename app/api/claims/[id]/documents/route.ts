import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const claimId = params.id
    
    // Verify claim exists
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("id, customer_id")
      .eq("id", claimId)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type and size
    const validTypes = [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "application/pdf"
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed" 
      }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 10MB" 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${claimId}/${timestamp}-${file.name}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("Documentos")
      .upload(fileName, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload file: " + uploadError.message 
      }, { status: 500 })
    }

    // Save document record to database
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        claim_id: claimId,
        customer_id: claim.customer_id,
        document_type: file.type.startsWith("image/") ? "photo" : "other",
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        is_verified: false,
      })
      .select()
      .single()

    if (docError) {
      console.error("Error saving document record:", docError)
      // Try to cleanup uploaded file
      await supabase.storage.from("Documentos").remove([fileName])
      return NextResponse.json({ 
        error: "Failed to save document record: " + docError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      document,
      message: "Document uploaded successfully" 
    }, { status: 201 })

  } catch (error) {
    console.error("Error in document upload:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const claimId = params.id

    // Get all documents for the claim
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("claim_id", claimId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}