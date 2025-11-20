"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Policy } from "@/lib/types/database";

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.id as string;
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    policy_type: "",
    payment_frequency: "",
    premium_amount: 0,
    auto_renewal: false,
    status: "",
  });

  useEffect(() => {
    fetchPolicy();
  }, [policyId]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("policies")
        .select(`
          *,
          customer:customers(
            *,
            user:users(*)
          ),
          vehicle:vehicles(*)
        `)
        .eq("id", policyId)
        .single();

      if (error) throw error;

      setPolicy(data);
      setFormData({
        policy_type: data.policy_type,
        payment_frequency: data.payment_frequency,
        premium_amount: data.premium_amount,
        auto_renewal: data.auto_renewal,
        status: data.status,
      });
    } catch (error) {
      console.error("Error fetching policy:", error);
      toast.error("Error al cargar la póliza");
      router.push("/policies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      const { error } = await supabase
        .from("policies")
        .update({
          policy_type: formData.policy_type,
          payment_frequency: formData.payment_frequency,
          premium_amount: formData.premium_amount,
          auto_renewal: formData.auto_renewal,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", policyId);

      if (error) throw error;

      toast.success("Póliza actualizada correctamente");
      router.push("/policies");
    } catch (error) {
      console.error("Error updating policy:", error);
      toast.error("Error al actualizar la póliza");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "agent"]}>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!policy) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "agent"]}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/policies")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Póliza</h1>
            <p className="text-muted-foreground">
              Póliza #{policy.policy_number}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-medium">
                  {policy.customer?.user?.first_name} {policy.customer?.user?.last_name}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{policy.customer?.user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vehículo</Label>
                <p className="font-medium">
                  {policy.vehicle?.year} {policy.vehicle?.make} {policy.vehicle?.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {policy.vehicle?.license_plate}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detalles de la Póliza</CardTitle>
              <CardDescription>
                Actualiza la información de la póliza
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="policy_type">Tipo de Póliza</Label>
                    <Select
                      value={formData.policy_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, policy_type: value })
                      }
                    >
                      <SelectTrigger id="policy_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basica">Básica</SelectItem>
                        <SelectItem value="limitada">Limitada</SelectItem>
                        <SelectItem value="amplia">Amplia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_frequency">Frecuencia de Pago</Label>
                    <Select
                      value={formData.payment_frequency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, payment_frequency: value })
                      }
                    >
                      <SelectTrigger id="payment_frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="premium_amount">Prima</Label>
                    <Input
                      id="premium_amount"
                      type="number"
                      step="0.01"
                      value={formData.premium_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          premium_amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="suspended">Suspendida</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                        <SelectItem value="expired">Vencida</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_renewal"
                    checked={formData.auto_renewal}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_renewal: checked as boolean })
                    }
                  />
                  <Label htmlFor="auto_renewal" className="cursor-pointer">
                    Renovación automática
                  </Label>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/policies")}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
