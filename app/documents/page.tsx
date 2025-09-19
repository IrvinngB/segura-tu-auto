"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/navigation/sidebar"
import { Upload, FileText, ImageIcon, AlertCircle, CheckCircle, X } from "lucide-react"

interface UploadedDocument {
  id: string
  name: string
  type: string
  size: number
  category: string
  status: "uploading" | "processing" | "verified" | "rejected"
  uploadProgress: number
  verificationResult?: {
    isValid: boolean
    confidence: number
    extractedData?: Record<string, any>
    issues?: string[]
  }
  uploadedAt: Date
}

const documentCategories = [
  { id: "license", name: "Licencia de Conducir", accept: "image/*,.pdf" },
  { id: "registration", name: "Registro Vehicular", accept: "image/*,.pdf" },
  { id: "insurance", name: "Póliza Anterior", accept: "image/*,.pdf" },
  { id: "identity", name: "Identificación", accept: "image/*,.pdf" },
  { id: "income", name: "Comprobante de Ingresos", accept: "image/*,.pdf" },
  { id: "claim", name: "Documentos de Reclamación", accept: "image/*,.pdf" },
  { id: "damage", name: "Fotos de Daños", accept: "image/*" },
  { id: "police", name: "Reporte Policial", accept: "image/*,.pdf" },
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("license")
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsUploading(true)

      acceptedFiles.forEach((file) => {
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Create document entry
        const newDocument: UploadedDocument = {
          id: documentId,
          name: file.name,
          type: file.type,
          size: file.size,
          category: selectedCategory,
          status: "uploading",
          uploadProgress: 0,
          uploadedAt: new Date(),
        }

        setDocuments((prev) => [...prev, newDocument])

        // Simulate upload progress
        simulateUpload(documentId, file)
      })
    },
    [selectedCategory],
  )

  const simulateUpload = async (documentId: string, file: File) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, uploadProgress: progress } : doc)))
    }

    // Change to processing
    setDocuments((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, status: "processing" } : doc)))

    // Simulate document verification
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Simulate verification result
    const isValid = Math.random() > 0.2 // 80% success rate
    const confidence = Math.random() * 0.3 + 0.7 // 70-100% confidence

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              status: isValid ? "verified" : "rejected",
              verificationResult: {
                isValid,
                confidence,
                extractedData: isValid ? generateMockExtractedData(doc.category) : undefined,
                issues: isValid ? [] : ["Documento ilegible", "Información incompleta"],
              },
            }
          : doc,
      ),
    )

    setIsUploading(false)
  }

  const generateMockExtractedData = (category: string) => {
    switch (category) {
      case "license":
        return {
          licenseNumber: "DL123456789",
          expiryDate: "2026-12-31",
          class: "B",
          restrictions: "Ninguna",
        }
      case "registration":
        return {
          plateNumber: "ABC-123",
          vin: "1HGBH41JXMN109186",
          year: "2020",
          make: "Honda",
          model: "Civic",
        }
      case "identity":
        return {
          idNumber: "12345678901",
          name: "Juan Pérez",
          birthDate: "1985-06-15",
          address: "Calle Principal 123",
        }
      default:
        return {}
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
  })

  const removeDocument = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 animate-spin" />
      case "processing":
        return <AlertCircle className="h-4 w-4 animate-pulse text-yellow-500" />
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploading":
        return <Badge variant="secondary">Subiendo</Badge>
      case "processing":
        return <Badge variant="default">Procesando</Badge>
      case "verified":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Verificado
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Documentos</h1>
            <p className="text-muted-foreground">Sistema de subida y verificación automática de documentos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Subir Documentos</CardTitle>
                  <CardDescription>
                    Seleccione el tipo de documento y arrastre los archivos o haga clic para seleccionar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Documento</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background"
                    >
                      {documentCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Drop Zone */}
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                      ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p className="text-primary">Suelte los archivos aquí...</p>
                    ) : (
                      <div>
                        <p className="text-foreground font-medium mb-2">
                          Arrastre archivos aquí o haga clic para seleccionar
                        </p>
                        <p className="text-sm text-muted-foreground">Soporta imágenes (PNG, JPG) y PDF hasta 10MB</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents List */}
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Subidos</CardTitle>
                  <CardDescription>Estado de verificación y procesamiento de documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No hay documentos subidos aún</div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(doc.status)}
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {documentCategories.find((c) => c.id === doc.category)?.name} •
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(doc.status)}
                              <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {doc.status === "uploading" && <Progress value={doc.uploadProgress} className="mb-2" />}

                          {doc.verificationResult && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Resultado de Verificación</span>
                                <span className="text-sm text-muted-foreground">
                                  Confianza: {(doc.verificationResult.confidence * 100).toFixed(0)}%
                                </span>
                              </div>

                              {doc.verificationResult.isValid ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-green-600">✓ Documento verificado correctamente</p>
                                  {doc.verificationResult.extractedData && (
                                    <div className="text-xs space-y-1">
                                      {Object.entries(doc.verificationResult.extractedData).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                                          <span className="font-mono">{value as string}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-red-600 mb-1">✗ Documento rechazado</p>
                                  {doc.verificationResult.issues && (
                                    <ul className="text-xs text-red-600 list-disc list-inside">
                                      {doc.verificationResult.issues.map((issue, index) => (
                                        <li key={index}>{issue}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document Categories Info */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Documentos</CardTitle>
                  <CardDescription>Documentos requeridos para diferentes procesos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentCategories.map((category) => (
                      <div key={category.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Verificación Automática</CardTitle>
                  <CardDescription>Nuestro sistema verifica automáticamente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Autenticidad del documento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Extracción de datos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Validación de fechas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Detección de alteraciones</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
