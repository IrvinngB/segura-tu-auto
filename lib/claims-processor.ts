// Sistema de procesamiento automático de reclamaciones

export interface ClaimProcessingResult {
  isAutoApproved: boolean
  requiresInvestigation: boolean
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  recommendedAction: string
  estimatedProcessingTime: number
  flags: string[]
  autoCalculatedAmount?: number
}

export interface ClaimAnalysis {
  fraudRisk: number
  complexityScore: number
  priorityLevel: "low" | "medium" | "high" | "urgent"
  requiredDocuments: string[]
  missingDocuments: string[]
}

export class ClaimsProcessor {
  private readonly autoApprovalThreshold = 5000 // $5,000
  private readonly fraudThreshold = 0.7 // 70% fraud probability
  private readonly complexityThreshold = 0.6 // 60% complexity score

  async processNewClaim(claimData: any): Promise<ClaimProcessingResult> {
    const analysis = await this.analyzeClaim(claimData)

    // Determine if auto-approval is possible
    const isAutoApproved = this.canAutoApprove(claimData, analysis)

    // Determine if investigation is required
    const requiresInvestigation = this.requiresInvestigation(claimData, analysis)

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(claimData, analysis)

    // Generate recommended action
    const recommendedAction = this.getRecommendedAction(claimData, analysis, isAutoApproved, requiresInvestigation)

    // Estimate processing time
    const estimatedProcessingTime = this.estimateProcessingTime(analysis, requiresInvestigation)

    // Generate flags
    const flags = this.generateFlags(claimData, analysis)

    // Auto-calculate amount if applicable
    const autoCalculatedAmount = isAutoApproved ? this.calculateClaimAmount(claimData) : undefined

    return {
      isAutoApproved,
      requiresInvestigation,
      riskLevel,
      recommendedAction,
      estimatedProcessingTime,
      flags,
      autoCalculatedAmount,
    }
  }

  private async analyzeClaim(claimData: any): Promise<ClaimAnalysis> {
    // Simulate AI-powered claim analysis
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const fraudRisk = this.calculateFraudRisk(claimData)
    const complexityScore = this.calculateComplexityScore(claimData)
    const priorityLevel = this.determinePriority(claimData, fraudRisk, complexityScore)
    const requiredDocuments = this.getRequiredDocuments(claimData)
    const missingDocuments = this.getMissingDocuments(claimData, requiredDocuments)

    return {
      fraudRisk,
      complexityScore,
      priorityLevel,
      requiredDocuments,
      missingDocuments,
    }
  }

  private calculateFraudRisk(claimData: any): number {
    let riskScore = 0

    // Time-based risk factors
    const incidentDate = new Date(claimData.incident_date)
    const reportDate = new Date(claimData.created_at)
    const daysBetween = Math.abs(reportDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysBetween > 30) riskScore += 0.2 // Late reporting
    if (daysBetween > 90) riskScore += 0.3 // Very late reporting

    // Amount-based risk
    if (claimData.estimated_damage_cost > 50000) riskScore += 0.2 // High amount
    if (claimData.estimated_damage_cost > 100000) riskScore += 0.3 // Very high amount

    // Incident type risk
    const highRiskTypes = ["theft", "fire", "vandalism"]
    if (highRiskTypes.includes(claimData.claim_type)) riskScore += 0.15

    // Location risk (if in high-crime area)
    if (claimData.incident_location?.toLowerCase().includes("zona roja")) riskScore += 0.25

    // Third party involvement
    if (!claimData.third_party_involved && claimData.claim_type === "collision") riskScore += 0.1

    // Missing police report for serious incidents
    if (!claimData.police_report_number && (claimData.injury_involved || claimData.estimated_damage_cost > 20000)) {
      riskScore += 0.2
    }

    return Math.min(1, riskScore)
  }

  private calculateComplexityScore(claimData: any): number {
    let complexityScore = 0

    // Injury involvement increases complexity
    if (claimData.injury_involved) complexityScore += 0.3

    // Third party involvement
    if (claimData.third_party_involved) complexityScore += 0.2

    // High damage amount
    if (claimData.estimated_damage_cost > 25000) complexityScore += 0.2

    // Certain claim types are more complex
    const complexTypes = ["fire", "flood", "theft"]
    if (complexTypes.includes(claimData.claim_type)) complexityScore += 0.15

    // Missing documentation
    const requiredDocs = this.getRequiredDocuments(claimData)
    const missingDocs = this.getMissingDocuments(claimData, requiredDocs)
    complexityScore += (missingDocs.length / requiredDocs.length) * 0.25

    return Math.min(1, complexityScore)
  }

  private determinePriority(
    claimData: any,
    fraudRisk: number,
    complexityScore: number,
  ): "low" | "medium" | "high" | "urgent" {
    // Urgent priority
    if (claimData.injury_involved || fraudRisk > 0.8 || claimData.estimated_damage_cost > 100000) {
      return "urgent"
    }

    // High priority
    if (fraudRisk > 0.6 || complexityScore > 0.7 || claimData.estimated_damage_cost > 50000) {
      return "high"
    }

    // Medium priority
    if (fraudRisk > 0.3 || complexityScore > 0.4 || claimData.estimated_damage_cost > 15000) {
      return "medium"
    }

    return "low"
  }

  private canAutoApprove(claimData: any, analysis: ClaimAnalysis): boolean {
    // Cannot auto-approve if high fraud risk
    if (analysis.fraudRisk > 0.4) return false

    // Cannot auto-approve if high complexity
    if (analysis.complexityScore > 0.5) return false

    // Cannot auto-approve if amount exceeds threshold
    if (claimData.estimated_damage_cost > this.autoApprovalThreshold) return false

    // Cannot auto-approve if injuries involved
    if (claimData.injury_involved) return false

    // Cannot auto-approve if third parties involved
    if (claimData.third_party_involved) return false

    // Cannot auto-approve if missing critical documents
    if (analysis.missingDocuments.length > 0) return false

    // Cannot auto-approve certain claim types
    const noAutoApprovalTypes = ["theft", "fire", "vandalism"]
    if (noAutoApprovalTypes.includes(claimData.claim_type)) return false

    return true
  }

  private requiresInvestigation(claimData: any, analysis: ClaimAnalysis): boolean {
    // High fraud risk requires investigation
    if (analysis.fraudRisk > this.fraudThreshold) return true

    // High complexity requires investigation
    if (analysis.complexityScore > this.complexityThreshold) return true

    // High amounts require investigation
    if (claimData.estimated_damage_cost > 25000) return true

    // Injuries always require investigation
    if (claimData.injury_involved) return true

    // Certain claim types require investigation
    const investigationTypes = ["theft", "fire", "vandalism"]
    if (investigationTypes.includes(claimData.claim_type)) return true

    return false
  }

  private calculateRiskLevel(claimData: any, analysis: ClaimAnalysis): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const riskScore = (analysis.fraudRisk + analysis.complexityScore) / 2

    if (claimData.injury_involved || analysis.fraudRisk > 0.8) return "CRITICAL"
    if (riskScore > 0.6) return "HIGH"
    if (riskScore > 0.3) return "MEDIUM"
    return "LOW"
  }

  private getRecommendedAction(
    claimData: any,
    analysis: ClaimAnalysis,
    isAutoApproved: boolean,
    requiresInvestigation: boolean,
  ): string {
    if (isAutoApproved) {
      return "AUTO_APPROVE"
    }

    if (analysis.fraudRisk > 0.8) {
      return "FRAUD_INVESTIGATION"
    }

    if (requiresInvestigation) {
      return "DETAILED_INVESTIGATION"
    }

    if (analysis.missingDocuments.length > 0) {
      return "REQUEST_DOCUMENTS"
    }

    if (analysis.complexityScore > 0.5) {
      return "ADJUSTER_REVIEW"
    }

    return "STANDARD_REVIEW"
  }

  private estimateProcessingTime(analysis: ClaimAnalysis, requiresInvestigation: boolean): number {
    let baseDays = 3 // Base processing time

    if (requiresInvestigation) baseDays += 7
    if (analysis.fraudRisk > 0.6) baseDays += 5
    if (analysis.complexityScore > 0.6) baseDays += 3
    if (analysis.missingDocuments.length > 0) baseDays += 2

    return baseDays
  }

  private generateFlags(claimData: any, analysis: ClaimAnalysis): string[] {
    const flags: string[] = []

    if (analysis.fraudRisk > 0.6) flags.push("HIGH_FRAUD_RISK")
    if (analysis.complexityScore > 0.6) flags.push("HIGH_COMPLEXITY")
    if (claimData.injury_involved) flags.push("INJURY_INVOLVED")
    if (claimData.third_party_involved) flags.push("THIRD_PARTY")
    if (claimData.estimated_damage_cost > 50000) flags.push("HIGH_VALUE")
    if (!claimData.police_report_number && claimData.injury_involved) flags.push("MISSING_POLICE_REPORT")
    if (analysis.missingDocuments.length > 0) flags.push("MISSING_DOCUMENTS")

    // Late reporting flag
    const incidentDate = new Date(claimData.incident_date)
    const reportDate = new Date(claimData.created_at)
    const daysBetween = Math.abs(reportDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysBetween > 30) flags.push("LATE_REPORTING")

    return flags
  }

  private calculateClaimAmount(claimData: any): number {
    // Simple calculation for auto-approved claims
    let amount = claimData.estimated_damage_cost || 0

    // Apply deductible (assume 10% or $500, whichever is higher)
    const deductible = Math.max(amount * 0.1, 500)
    amount = Math.max(0, amount - deductible)

    // Cap at auto-approval threshold
    return Math.min(amount, this.autoApprovalThreshold)
  }

  private getRequiredDocuments(claimData: any): string[] {
    const required = ["photos", "police_report"]

    if (claimData.injury_involved) {
      required.push("medical_report", "hospital_records")
    }

    if (claimData.third_party_involved) {
      required.push("third_party_info", "witness_statements")
    }

    if (claimData.claim_type === "theft") {
      required.push("theft_report", "key_inventory")
    }

    if (claimData.estimated_damage_cost > 10000) {
      required.push("repair_estimates", "vehicle_inspection")
    }

    return required
  }

  private getMissingDocuments(claimData: any, requiredDocuments: string[]): string[] {
    // Simulate checking for missing documents
    // In real implementation, this would check the claim_documents table
    const providedDocuments = claimData.documents || []
    return requiredDocuments.filter((doc) => !providedDocuments.includes(doc))
  }
}

// Singleton instance
export const claimsProcessor = new ClaimsProcessor()
