'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { SuccessModal } from '@/components/ui/success-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { Shield, Mail, Lock, User, Phone, Eye, EyeOff, Home, Calendar, Car } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer', // Solo customer permitido en registro público
    // Location information
    country: 'Costa Rica',
    // Driver information
    birthDate: '',
    licenseYear: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isFormValidState, setIsFormValidState] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // UseEffect para actualizar la validez del formulario en tiempo real
  useEffect(() => {
    setIsFormValidState(isFormValid());
  }, [formData]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para manejar errores de forma amigable
  const handleError = (errorMessage: string) => {
    const errorMap: { [key: string]: string } = {
      'User already registered':
        'Este correo electrónico ya está registrado. Intenta iniciar sesión o usar otro correo.',
      'Invalid email': 'Por favor, ingresa un correo electrónico válido.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      'Signup is disabled': 'El registro está temporalmente deshabilitado. Inténtalo más tarde.',
      'Email rate limit exceeded':
        'Demasiados intentos de registro. Espera unos minutos antes de intentar nuevamente.',
      'duplicate key value violates unique constraint':
        'Este correo electrónico ya está registrado. Intenta iniciar sesión.',
    };

    // Buscar coincidencias exactas o parciales
    let friendlyMessage = 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';

    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        friendlyMessage = value;
        break;
      }
    }

    setError(friendlyMessage);

    // Scroll automático hacia arriba para mostrar el error
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      handleError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      handleError(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial'
      );
      setLoading(false);
      return;
    }

    // Validar roles permitidos en registro público
    const allowedRoles = ['customer']; // Solo clientes en registro público
    if (!allowedRoles.includes(formData.role)) {
      handleError(
        'Solo se permite el registro de clientes. Los agentes y administradores son creados por el administrador del sistema.'
      );
      setLoading(false);
      return;
    }

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Para desarrollo, no requerir confirmación por email
          emailRedirectTo:
            process.env.NODE_ENV === 'development'
              ? undefined
              : `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (error) {
        handleError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Usuario creado en auth:', data.user.id);
        console.log('📧 Email confirmado:', data.user.email_confirmed_at !== null);

        // Si el email no está confirmado, mostrar mensaje de confirmación
        if (!data.user.email_confirmed_at) {
          console.log('📬 Email no confirmado, mostrando modal de confirmación');
          setShowSuccessModal(true);
          setLoading(false); // ¡Importante! Resetear loading state
          return; // No crear registros adicionales hasta confirmar email
        }

        console.log('📝 Procediendo a insertar usuario en tabla users...');

        // Insert user data into users table
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            role: formData.role,
            password_hash: 'handled_by_supabase_auth',
          })
          .select();

        if (insertError) {
          console.error('Error insertando usuario:', insertError);
          handleError(insertError.message);
          setLoading(false);
          return;
        }

        console.log('Usuario insertado en tabla users:', userData);

        // If customer, create customer profile
        if (formData.role === 'customer') {
          // Calculate driving experience from license year
          const currentYear = new Date().getFullYear();
          const drivingExperience = formData.licenseYear
            ? currentYear - parseInt(formData.licenseYear)
            : null;

          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .insert({
              user_id: data.user.id,
              date_of_birth: formData.birthDate || null,
              // Location field
              country: formData.country || 'Costa Rica',
              // Driver information
              driving_experience_years: drivingExperience,
            })
            .select();
          if (customerError) {
            console.error('Error creando perfil de cliente:', customerError);
            handleError(customerError.message);
            setLoading(false);
            return;
          }

          console.log('Perfil de cliente creado:', customerData);
        } else if (formData.role === 'agent') {
          // For agents, we might want to create a different profile or just the user record
          // This can be extended later if needed
          console.log('Perfil de agente creado - solo registro de usuario');
        }

        // Mostrar modal de éxito
        console.log('🎉 Registro completado exitosamente!');
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      handleError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Redirigir al login después del registro exitoso
    router.push('/login');
  };

  // Función para validar la contraseña
  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false; // Al menos una mayúscula
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false; // Al menos un carácter especial
    return true;
  };

  // Funciones para validar cada requisito individualmente
  const hasMinLength = (password: string) => password.length >= 8;
  const hasUppercase = (password: string) => /[A-Z]/.test(password);
  const hasSpecialChar = (password: string) =>
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Función para verificar si todos los campos requeridos están completos
  const isFormValid = () => {
    // Validación básica de email
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Validaciones individuales para debugging
    const validations = {
      firstName: formData.firstName.trim() !== '',
      lastName: formData.lastName.trim() !== '',
      email: formData.email.trim() !== '',
      emailFormat: isValidEmail(formData.email.trim()),
      phone: formData.phone.trim() !== '',
      password: formData.password.trim() !== '',
      confirmPassword: formData.confirmPassword.trim() !== '',
      passwordsMatch: formData.password === formData.confirmPassword,
      passwordValid: validatePassword(formData.password),
    };

    // Campos básicos requeridos para todos los roles
    const basicFieldsComplete = Object.values(validations).every(v => v === true);

    // Si es customer, verificar campos adicionales requeridos
    if (formData.role === 'customer') {
      const customerValidations = {
        country: formData.country.trim() !== '',
        birthDate: formData.birthDate.trim() !== '',
        licenseYear: formData.licenseYear.trim() !== '',
        licenseYearLength: formData.licenseYear.trim().length >= 4,
      };

      const customerFieldsComplete = Object.values(customerValidations).every(v => v === true);
      const finalResult = basicFieldsComplete && customerFieldsComplete;

      // Debug logs (temporal)
      console.log('🔍 Form Validation Debug:', {
        basic: validations,
        customer: customerValidations,
        basicComplete: basicFieldsComplete,
        customerComplete: customerFieldsComplete,
        finale: finalResult,
        formData: {
          firstName: `"${formData.firstName}"`,
          lastName: `"${formData.lastName}"`,
          email: `"${formData.email}"`,
          phone: `"${formData.phone}"`,
          password: `"${formData.password}"`,
          confirmPassword: `"${formData.confirmPassword}"`,
          country: `"${formData.country}"`,
          birthDate: `"${formData.birthDate}"`,
          licenseYear: `"${formData.licenseYear}"`,
        },
      });

      return finalResult;
    }

    // Para otros roles, solo campos básicos
    console.log('🔍 Form Validation (Basic):', validations, basicFieldsComplete);
    return basicFieldsComplete;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Botón de volver al inicio - Posición superior */}
      <Link href="/" className="fixed top-6 left-6 z-50 group">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white dark:hover:bg-gray-700"
        >
          <Home className="h-4 w-4 mr-2 text-primary group-hover:text-primary/80 transition-colors" />
          <span className="font-medium">Inicio</span>
        </Button>
      </Link>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SeguraTuAuto</h1>
          <p className="text-muted-foreground mt-2">Crea tu cuenta</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Registro</CardTitle>
            <CardDescription>Completa la información para crear tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={e => handleInputChange('firstName', e.target.value)}
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
                    value={formData.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuario</Label>
                <Select
                  value={formData.role}
                  onValueChange={value => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent className="z-50" position="popper" side="bottom" align="start">
                    <SelectItem value="customer">Cliente</SelectItem>
                    {/* Solo clientes pueden registrarse públicamente */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="text-xs space-y-1">
                  <div
                    className={`flex items-center gap-2 ${
                      hasMinLength(formData.password) ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasMinLength(formData.password) ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    ></span>
                    Mínimo 8 caracteres
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      hasUppercase(formData.password) ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasUppercase(formData.password) ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    ></span>
                    Al menos 1 mayúscula
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      hasSpecialChar(formData.password) ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasSpecialChar(formData.password) ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    ></span>
                    Al menos 1 carácter especial
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 pr-10"
                    required
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
              </div>

              {/* Location Information Section - Only for customers */}
              {formData.role === 'customer' && (
                <>
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Información de Ubicación
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona tu país de residencia
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País de Residencia *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={value => handleInputChange('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu país *" />
                      </SelectTrigger>
                      <SelectContent className="z-50" position="popper" side="bottom" align="start">
                        <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                        <SelectItem value="Guatemala">Guatemala</SelectItem>
                        <SelectItem value="Honduras">Honduras</SelectItem>
                        <SelectItem value="El Salvador">El Salvador</SelectItem>
                        <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                        <SelectItem value="Panamá">Panamá</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Driver Information Section - Only for customers */}
              {formData.role === 'customer' && (
                <>
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Información del Conductor
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta información nos ayuda a calcular cotizaciones personalizadas
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={e => handleInputChange('birthDate', e.target.value)}
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
                        value={formData.licenseYear}
                        onChange={e => handleInputChange('licenseYear', e.target.value)}
                        min="1970"
                        max={new Date().getFullYear()}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading || !isFormValidState}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <SuccessModal
        show={showSuccessModal}
        title="¡Registro Exitoso!"
        message="Tu cuenta ha sido creada exitosamente."
        duration={1500}
        onClose={handleSuccessModalClose}
      />
    </div>
  );
}
