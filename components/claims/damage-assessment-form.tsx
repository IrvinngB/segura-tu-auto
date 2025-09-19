"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import type { Claim } from "@/lib/types/database"
import { ClipboardCheck, DollarSign, Camera, X } from "lucide-react"

interface DamageAssessmentFormProps {
  claim: Claim
  adjusterId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function DamageAssessmentForm({ claim, adjusterId, onSuccess, onCancel }: DamageAssessmentFormProps) {
  const [assessmentData, setAssessmentData] = useState({
    damageDescription: "",
    repairEstimate: "",
    replacementEstimate: "",
    recommendedAction: "repair",
    assessmentNotes: "",
    isFinal: false,
  })
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const supabase = createClient()

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setAssessmentData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/png", "image/gif"]
      const maxSize = 10 * 1024 * 1024 // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    if (validFiles.length !== files.length) {
      setError("Algunos archivos no son válidos. Solo se permiten imágenes (JPG, PNG, GIF) hasta 10MB")
    }

    setUploadedPhotos((prev) => [...prev, ...validFiles])
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Upload photos first
      const photoUrls: string[] = []
      if (uploadedPhotos.length > 0) {
        for (const photo of uploadedPhotos) {
          const fileName = `assessments/${claim.id}/${Date.now()}-${photo.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("claim-documents")
            .upload(fileName, photo)

          if (uploadError) {
            console.error("Error uploading photo:", uploadError)
            continue
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("claim-documents").getPublicUrl(uploadData.path)
          photoUrls.push(publicUrl)
        }
      }

      // Create damage assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from("damage_assessments")
        .insert({
          claim_id: claim.id,
          adjuster_id: adjusterId,
          damage_description: assessmentData.damageDescription,
          repair_estimate: assessmentData.repairEstimate ? Number.parseFloat(assessmentData.repairEstimate) : null,
          replacement_estimate: assessmentData.replacementEstimate
            ? Number.parseFloat(assessmentData.replacementEstimate)
            : null,
          recommended_action: assessmentData.recommendedAction,
          photos: photoUrls,
          assessment_notes: assessmentData.assessmentNotes || null,
          is_final: assessmentData.isFinal,
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      // Update claim status if this is a final assessment
      if (assessmentData.isFinal) {
        const recommendedAmount = Math.min(
          Number.parseFloat(assessmentData.repairEstimate || "0"),
          Number.parseFloat(assessmentData.replacementEstimate || "0") || Number.POSITIVE_INFINITY,
        )

        await supabase
          .from("claims")
          .update({
            status: "approved",
            approved_amount: recommendedAmount,
          })
          .eq("id", claim.id)
      } else {
        // Update to investigating status
        await supabase.from("claims").update({ status: "investigating" }).eq("id", claim.id)
      }

      setSuccess("Evaluación de daños guardada exitosamente")

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500)
      }
    } catch (error) {
      console.error("Error creating damage assessment:", error)
      setError("Error al guardar la evaluación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Evaluación de Daños
        </CardTitle>
        <CardDescription>
          Reclamación: {claim.claim_number} - {claim.policy?.vehicle?.year} {claim.policy?.vehicle?.make}{" "}
          {claim.policy?.vehicle?.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Damage Description */}
          <div className="space-y-2">
            <Label htmlFor="damageDescription">Descripción de Daños *</Label>
            <Textarea
              id="damageDescription"
              placeholder="Describa detalladamente los daños encontrados..."
              value={assessmentData.damageDescription}
              onChange={(e) => handleInputChange("damageDescription", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Cost Estimates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="repairEstimate">Estimado de Reparación</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="repairEstimate"
                  type="number"
                  placeholder="0.00"
                  value={assessmentData.repairEstimate}
                  onChange={(e) => handleInputChange("repairEstimate", e.target.value)}
                  className="pl-10"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replacementEstimate">Estimado de Reemplazo</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="replacementEstimate"
                  type="number"
                  placeholder="0.00"
                  value={assessmentData.replacementEstimate}
                  onChange={(e) => handleInputChange("replacementEstimate", e.target.value)}
                  className="pl-10"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="space-y-2">
            <Label htmlFor="recommendedAction">Acción Recomendada</Label>
            <Select
              value={assessmentData.recommendedAction}
              onValueChange={(value) => handleInputChange("recommendedAction", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">Reparar</SelectItem>
                <SelectItem value="replace">Reemplazar</SelectItem>
                <SelectItem value="total_loss">Pérdida Total</SelectItem>
                <SelectItem value="no_action">Sin Acción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photos Upload */}
          <div className="space-y-4">
            <Label>Fotografías de Daños</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-primary hover:text-primary/80">
                      Subir fotografías
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">PNG, JPG, GIF hasta 10MB cada una</span>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Uploaded Photos */}
            {uploadedPhotos.length > 0 && (
              <div className="space-y-2">
                <Label>Fotografías seleccionadas:</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo) || "/placeholder.svg"}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="text-xs text-center mt-1 truncate">{photo.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assessment Notes */}
          <div className="space-y-2">
            <Label htmlFor="assessmentNotes">Notas Adicionales</Label>
            <Textarea
              id="assessmentNotes"
              placeholder="Observaciones adicionales, recomendaciones especiales..."
              value={assessmentData.assessmentNotes}
              onChange={(e) => handleInputChange("assessmentNotes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Final Assessment Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFinal"
              checked={assessmentData.isFinal}
              onCheckedChange={(checked) => handleInputChange("isFinal", checked as boolean)}
            />
            <Label htmlFor="isFinal">Esta es la evaluación final (aprobará automáticamente la reclamación)</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={loading || !assessmentData.damageDescription} className="flex-1">
              {loading ? "Guardando evaluación..." : "Guardar Evaluación"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
