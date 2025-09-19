import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"

interface CustomerData {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

export function useCustomerData() {
  const { userProfile } = useAuth()
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCustomerData = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Cache simple para evitar consultas repetidas
      const cacheKey = `customer_data_${userProfile.id}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (cached) {
        const parsed = JSON.parse(cached)
        // Cache válido por 5 minutos
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setCustomerData(parsed.data)
          setLoading(false)
          return
        }
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select(`
          id,
          user_id,
          user:users!customers_user_id_fkey(
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq("user_id", userProfile.id)
        .single()

      if (customerError) {
        console.error("Error fetching customer data:", customerError)
        setError("Error al cargar los datos del cliente")
        return
      }

      if (customer) {
        const customerInfo = {
          id: customer.id,
          user_id: customer.user_id,
          first_name: customer.user.first_name,
          last_name: customer.user.last_name,
          email: customer.user.email,
          role: customer.user.role
        }

        setCustomerData(customerInfo)

        // Guardar en cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: customerInfo,
          timestamp: Date.now()
        }))
      } else {
        setError("No se encontró el perfil de cliente")
      }
    } catch (error) {
      console.error("Error fetching customer data:", error)
      setError("Error inesperado al cargar los datos del cliente")
    } finally {
      setLoading(false)
    }
  }, [userProfile?.id, supabase])

  useEffect(() => {
    fetchCustomerData()
  }, [fetchCustomerData])

  const refreshCustomerData = useCallback(() => {
    // Limpiar cache y recargar
    if (userProfile?.id) {
      const cacheKey = `customer_data_${userProfile.id}`
      sessionStorage.removeItem(cacheKey)
    }
    fetchCustomerData()
  }, [fetchCustomerData, userProfile?.id])

  return {
    customerData,
    loading,
    error,
    refreshCustomerData
  }
}
