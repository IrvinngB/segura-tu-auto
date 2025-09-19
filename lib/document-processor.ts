// Sistema de procesamiento y verificación de documentos

export interface DocumentProcessingResult {
  isValid: boolean
  confidence: number
  extractedData: Record<string, any>
  issues: string[]
  processingTime: number
}

export interface DocumentMetadata {
  filename: string
  fileType: string
  fileSize: number
  category: string
  uploadedAt: Date
  processedAt?: Date
}

export class DocumentProcessor {
  private readonly supportedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

  private readonly maxFileSize = 10 * 1024 * 1024 // 10MB

  async processDocument(file: File, category: string): Promise<DocumentProcessingResult> {
    const startTime = Date.now()

    // Validate file
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      return {
        isValid: false,
        confidence: 0,
        extractedData: {},
        issues: validation.issues,
        processingTime: Date.now() - startTime,
      }
    }

    try {
      // Extract text/data from document
      const extractedData = await this.extractData(file, category)

      // Verify document authenticity
      const verification = await this.verifyDocument(extractedData, category)

      // Validate extracted data
      const dataValidation = this.validateExtractedData(extractedData, category)

      const processingTime = Date.now() - startTime

      return {
        isValid: verification.isValid && dataValidation.isValid,
        confidence: Math.min(verification.confidence, dataValidation.confidence),
        extractedData: extractedData,
        issues: [...verification.issues, ...dataValidation.issues],
        processingTime,
      }
    } catch (error) {
      return {
        isValid: false,
        confidence: 0,
        extractedData: {},
        issues: ["Error procesando el documento"],
        processingTime: Date.now() - startTime,
      }
    }
  }

  private validateFile(file: File): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    if (!this.supportedTypes.includes(file.type)) {
      issues.push("Tipo de archivo no soportado")
    }

    if (file.size > this.maxFileSize) {
      issues.push("Archivo demasiado grande (máximo 10MB)")
    }

    if (file.size === 0) {
      issues.push("Archivo vacío")
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  }

  private async extractData(file: File, category: string): Promise<Record<string, any>> {
    // Simulate OCR/data extraction
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock extracted data based on category
    switch (category) {
      case "license":
        return this.extractLicenseData(file)
      case "registration":
        return this.extractRegistrationData(file)
      case "identity":
        return this.extractIdentityData(file)
      case "insurance":
        return this.extractInsuranceData(file)
      case "income":
        return this.extractIncomeData(file)
      case "claim":
        return this.extractClaimData(file)
      case "damage":
        return this.extractDamageData(file)
      case "police":
        return this.extractPoliceReportData(file)
      default:
        return {}
    }
  }

  private extractLicenseData(file: File): Record<string, any> {
    return {
      licenseNumber: this.generateMockLicenseNumber(),
      fullName: "Juan Carlos Pérez García",
      dateOfBirth: "1985-06-15",
      expiryDate: "2026-12-31",
      class: "B",
      restrictions: "Ninguna",
      issuedBy: "Secretaría de Movilidad",
      address: "Calle Principal 123, Ciudad, Estado",
    }
  }

  private extractRegistrationData(file: File): Record<string, any> {
    return {
      plateNumber: this.generateMockPlateNumber(),
      vin: this.generateMockVIN(),
      year: "2020",
      make: "Honda",
      model: "Civic",
      color: "Blanco",
      engineNumber: "ENG123456789",
      ownerName: "Juan Carlos Pérez García",
      registrationDate: "2020-03-15",
      expiryDate: "2025-03-15",
    }
  }

  private extractIdentityData(file: File): Record<string, any> {
    return {
      idNumber: this.generateMockIDNumber(),
      fullName: "Juan Carlos Pérez García",
      dateOfBirth: "1985-06-15",
      placeOfBirth: "Ciudad, Estado",
      address: "Calle Principal 123, Ciudad, Estado",
      issuedDate: "2020-01-15",
      expiryDate: "2030-01-15",
      nationality: "Mexicana",
    }
  }

  private extractInsuranceData(file: File): Record<string, any> {
    return {
      policyNumber: this.generateMockPolicyNumber(),
      insurer: "Seguros Anteriores SA",
      policyHolder: "Juan Carlos Pérez García",
      effectiveDate: "2023-01-01",
      expiryDate: "2023-12-31",
      coverage: "Amplia",
      vehiclePlate: this.generateMockPlateNumber(),
      premiumAmount: "12000",
    }
  }

  private extractIncomeData(file: File): Record<string, any> {
    return {
      employerName: "Empresa ABC SA de CV",
      employeeName: "Juan Carlos Pérez García",
      position: "Gerente de Ventas",
      monthlyIncome: "25000",
      period: "2024-01",
      issuedDate: "2024-02-01",
    }
  }

  private extractClaimData(file: File): Record<string, any> {
    return {
      claimNumber: this.generateMockClaimNumber(),
      incidentDate: "2024-01-15",
      incidentType: "Colisión",
      location: "Av. Principal y Calle 5ta",
      description: "Colisión frontal en intersección",
      estimatedDamage: "15000",
    }
  }

  private extractDamageData(file: File): Record<string, any> {
    return {
      imageType: "Foto de daños",
      damageLocation: "Parte frontal",
      severity: "Moderado",
      estimatedRepairCost: "8000",
      captureDate: new Date().toISOString().split("T")[0],
    }
  }

  private extractPoliceReportData(file: File): Record<string, any> {
    return {
      reportNumber: this.generateMockReportNumber(),
      incidentDate: "2024-01-15",
      location: "Av. Principal y Calle 5ta",
      officerName: "Oficial García",
      reportDate: "2024-01-15",
      incidentType: "Accidente vehicular",
    }
  }

  private async verifyDocument(
    extractedData: Record<string, any>,
    category: string,
  ): Promise<{ isValid: boolean; confidence: number; issues: string[] }> {
    // Simulate document verification
    await new Promise((resolve) => setTimeout(resolve, 500))

    const issues: string[] = []
    let confidence = 0.9

    // Check for required fields based on category
    const requiredFields = this.getRequiredFields(category)
    const missingFields = requiredFields.filter((field) => !extractedData[field])

    if (missingFields.length > 0) {
      issues.push(`Campos faltantes: ${missingFields.join(", ")}`)
      confidence -= 0.2
    }

    // Check date validity
    if (extractedData.expiryDate) {
      const expiryDate = new Date(extractedData.expiryDate)
      if (expiryDate < new Date()) {
        issues.push("Documento vencido")
        confidence -= 0.3
      }
    }

    // Simulate random verification issues (10% chance)
    if (Math.random() < 0.1) {
      issues.push("Posible alteración detectada")
      confidence -= 0.4
    }

    return {
      isValid: issues.length === 0 && confidence > 0.5,
      confidence: Math.max(0, confidence),
      issues,
    }
  }

  private validateExtractedData(
    data: Record<string, any>,
    category: string,
  ): { isValid: boolean; confidence: number; issues: string[] } {
    const issues: string[] = []
    let confidence = 0.95

    // Category-specific validation
    switch (category) {
      case "license":
        if (data.licenseNumber && !/^[A-Z0-9]{8,12}$/.test(data.licenseNumber)) {
          issues.push("Formato de número de licencia inválido")
          confidence -= 0.2
        }
        break

      case "registration":
        if (data.plateNumber && !/^[A-Z]{3}-[0-9]{3}$/.test(data.plateNumber)) {
          issues.push("Formato de placa inválido")
          confidence -= 0.2
        }
        break

      case "identity":
        if (data.idNumber && !/^[0-9]{11}$/.test(data.idNumber)) {
          issues.push("Formato de CURP inválido")
          confidence -= 0.2
        }
        break
    }

    return {
      isValid: issues.length === 0,
      confidence: Math.max(0, confidence),
      issues,
    }
  }

  private getRequiredFields(category: string): string[] {
    const fieldMap: Record<string, string[]> = {
      license: ["licenseNumber", "fullName", "expiryDate"],
      registration: ["plateNumber", "vin", "ownerName"],
      identity: ["idNumber", "fullName", "dateOfBirth"],
      insurance: ["policyNumber", "insurer", "expiryDate"],
      income: ["employerName", "employeeName", "monthlyIncome"],
      claim: ["claimNumber", "incidentDate", "incidentType"],
      damage: ["imageType", "damageLocation"],
      police: ["reportNumber", "incidentDate", "officerName"],
    }

    return fieldMap[category] || []
  }

  // Mock data generators
  private generateMockLicenseNumber(): string {
    return "DL" + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  private generateMockPlateNumber(): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    return (
      Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("") +
      "-" +
      Array.from({ length: 3 }, () => numbers[Math.floor(Math.random() * numbers.length)]).join("")
    )
  }

  private generateMockVIN(): string {
    return "1HGBH41JXMN" + Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  private generateMockIDNumber(): string {
    return Math.random().toString().substr(2, 11)
  }

  private generateMockPolicyNumber(): string {
    return "POL" + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  private generateMockClaimNumber(): string {
    return "CLM" + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  private generateMockReportNumber(): string {
    return "RPT" + Math.random().toString(36).substr(2, 9).toUpperCase()
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessor()
