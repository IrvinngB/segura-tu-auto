'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Home,
  Calendar,
  Car,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PasswordRequirements } from '@/components/auth/password-requirements';
import { isPasswordValid } from '@/lib/validations/password';

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface CustomerData {
  address: string;
  date_of_birth: string;
  country: string;
  licenseYear: string;
}

export default function CustomerProfilePage() {
  const { user, userProfile } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [customerData, setCustomerData] = useState<CustomerData>({
    address: '',
    date_of_birth: '',
    country: '',
    licenseYear: '',
  });
  const [customerId, setCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Traduce errores del backend a mensajes en español para mostrar en la UI
  const translateErrorToSpanish = (error: any, defaultMessage: string) => {
    try {
      if (!error) return defaultMessage;
      const raw = typeof error === 'string' ? error : error?.message || '';
      const lower = (raw || '').toLowerCase();

      if (error?.code === 'PGRST116' || lower.includes('no rows') || lower.includes('not found')) {
        return 'Registro no encontrado';
      }
      if (lower.includes('duplicate') || lower.includes('unique') || lower.includes('23505')) {
        return 'Ya existe un registro con ese valor';
      }
      if (lower.includes('password') || lower.includes('contraseña')) {
        return 'Error con la contraseña. Revisa que cumpla los requisitos.';
      }
      if (lower.includes('invalid') || lower.includes('invalid input')) {
        return 'Entrada inválida';
      }

      return defaultMessage;
    } catch (e) {
      return defaultMessage;
    }
  };

  useEffect(() => {
    if (user && userProfile) {
      fetchProfileData();
    }
  }, [user, userProfile]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtener datos del usuario autenticado
      const { data: authUser, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (authUser.user) {
        // Obtener datos completos de la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, last_name, phone')
          .eq('id', authUser.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error al obtener datos del usuario:', userError);
        }

        setUserData({
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          email: authUser.user.email || '',
          phone: userData?.phone || '',
        });
      }

      // Obtener datos del cliente
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, address, date_of_birth, driving_experience_years, country')
        .eq('user_id', user?.id)
        .single();

      if (customerError && customerError.code !== 'PGRST116') {
        console.error('Error al obtener datos del cliente:', customerError);
      } else if (customer) {
        setCustomerId(customer.id);
        
        // Calcular año de licencia basado en años de experiencia
        let calculatedLicenseYear = '';
        if (customer.driving_experience_years !== undefined && customer.driving_experience_years !== null) {
          const currentYear = new Date().getFullYear();
          calculatedLicenseYear = (currentYear - customer.driving_experience_years).toString();
        }

        setCustomerData({
          address: customer.address || '',
          date_of_birth: customer.date_of_birth || '',
          country: customer.country || '',
          licenseYear: calculatedLicenseYear,
        });
      }
    } catch (error) {
      console.error('Error al cargar los datos del perfil:', error);
      setError('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerDataChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (field === 'newPassword') setPasswordTouched(true);
    if (field === 'confirmPassword') setConfirmTouched(true);
  };

  const isFormValid = () => {
    const requiredFields = [
      userData.first_name,
      userData.last_name,
      userData.phone,
      customerData.country,
      customerData.date_of_birth,
      customerData.licenseYear,
    ];
    
    // Check if all required fields are filled
    if (requiredFields.some(field => !field || field.trim() === '')) {
      return false;
    }

    // Validate license year format
    if (customerData.licenseYear.length !== 4) {
      return false;
    }

    return true;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Actualizar datos del usuario en auth.users (metadata)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
        },
      });

      if (updateError) {
        throw updateError;
      }

      // Actualizar datos en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
        })
        .eq('id', user?.id);

      if (userError) {
        throw userError;
      }

      // Calcular driving_experience_years
      const currentYear = new Date().getFullYear();
      const licenseYearInt = parseInt(customerData.licenseYear);
      const drivingExperience = currentYear - licenseYearInt;

      // Actualizar o insertar datos del cliente
      if (customerId) {
        // Actualizar cliente existente
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            address: customerData.address,
            date_of_birth: customerData.date_of_birth || null,
            country: customerData.country,
            driving_experience_years: drivingExperience >= 0 ? drivingExperience : 0,
          })
          .eq('id', customerId);

        if (customerError) {
          throw customerError;
        }
      } else {
        // Crear nuevo registro de cliente
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user?.id,
            address: customerData.address,
            date_of_birth: customerData.date_of_birth || null,
            country: customerData.country,
            driving_experience_years: drivingExperience >= 0 ? drivingExperience : 0,
          })
          .select('id')
          .single();

        if (customerError) {
          throw customerError;
        }

        if (newCustomer) {
          setCustomerId(newCustomer.id);
        }
      }

      setSuccess('Tu perfil se actualizó correctamente.');

      // Recargar los datos sin recargar toda la página
      await fetchProfileData();
    } catch (error: any) {
      console.error('Error al actualizar el perfil:', error);
      const mensaje = translateErrorToSpanish(error, 'Error al actualizar el perfil');
      setError(mensaje);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setChangingPassword(false);
      return;
    }

    if (!isPasswordValid(passwordData.newPassword)) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      setChangingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccess('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordTouched(false);
      setConfirmTouched(false);
    } catch (error: any) {
      console.error('Error al cambiar la contraseña:', error);
      const mensaje = translateErrorToSpanish(error, 'Error al cambiar la contraseña');
      setError(mensaje);
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordIsValid = isPasswordValid(passwordData.newPassword);
  const passwordsMatch = passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword;
  const canSubmitPassword = passwordIsValid && passwordsMatch;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mi Perfil</h1>
              <p className="text-muted-foreground">Actualiza tu información personal</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-500/15 text-green-600 border-green-500/30">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>Actualiza tus datos personales básicos</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Sección 1: Información Personal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="Juan"
                          value={userData.first_name}
                          onChange={e => handleUserDataChange('first_name', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido *</Label>
                      <Input
                        id="lastName"
                        placeholder="Pérez"
                        value={userData.last_name}
                        onChange={e => handleUserDataChange('last_name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        className="pl-10 bg-muted/50"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El correo electrónico no se puede cambiar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        value={userData.phone}
                        onChange={e => handleUserDataChange('phone', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Ingresa tu dirección de residencia..."
                      value={customerData.address}
                      onChange={e => handleCustomerDataChange('address', e.target.value)}
                    />
                  </div>

                  {/* Sección 2: Información de Ubicación */}
                  <div className="pt-4 border-t border-border mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Información de Ubicación
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País de Residencia *</Label>
                    <Select
                      value={customerData.country}
                      onValueChange={value => handleCustomerDataChange('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                        <SelectItem value="Guatemala">Guatemala</SelectItem>
                        <SelectItem value="Honduras">Honduras</SelectItem>
                        <SelectItem value="El Salvador">El Salvador</SelectItem>
                        <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                        <SelectItem value="Panamá">Panamá</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sección 3: Información del Conductor */}
                  <div className="pt-4 border-t border-border mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Información del Conductor
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={customerData.date_of_birth}
                          onChange={e => handleCustomerDataChange('date_of_birth', e.target.value)}
                          className="pl-10"
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseYear">Año que Obtuvo la Licencia *</Label>
                      <Input
                        id="licenseYear"
                        type="number"
                        placeholder="2010"
                        value={customerData.licenseYear}
                        onChange={e => handleCustomerDataChange('licenseYear', e.target.value)}
                        min="1970"
                        max={new Date().getFullYear()}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={saving}>
                    {saving ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Cambios
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Cambiar Contraseña */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        value={passwordData.newPassword}
                        onChange={e => handlePasswordChange('newPassword', e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {/* Password Requirements */}
                    <PasswordRequirements password={passwordData.newPassword} />
                    {passwordTouched && !passwordIsValid && passwordData.newPassword.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Tu contraseña no cumple con los requisitos.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repite tu nueva contraseña"
                        value={passwordData.confirmPassword}
                        onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {confirmTouched && !passwordsMatch && passwordData.confirmPassword.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Las contraseñas no coinciden.
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      changingPassword || !canSubmitPassword
                    }
                  >
                    {changingPassword ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Cambiar Contraseña
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
