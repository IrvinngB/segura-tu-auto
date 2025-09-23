// Versión simplificada de handleRegister sin campos opcionales
// Usar esta versión si no se pueden agregar las columnas has_accidents y has_claims

const handleRegisterSimplified = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
    }

    if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
    }

    try {
        // Create auth user
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                emailRedirectTo: undefined,
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    role: formData.role,
                },
            },
        });

        if (error) {
            setError(`Error de autenticación: ${error.message}`);
            return;
        }

        if (data.user) {
            console.log("Usuario creado en auth:", data.user.id);

            // Insert user data into users table (ONLY basic fields)
            const { data: userData, error: insertError } = await supabase
                .from("users")
                .insert({
                    id: data.user.id,
                    email: formData.email,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    role: formData.role,
                    password_hash: "handled_by_supabase_auth",
                })
                .select();

            if (insertError) {
                console.error("Error insertando usuario:", insertError);
                setError(`Error creando perfil de usuario: ${insertError.message}`);
                return;
            }

            console.log("Usuario insertado en tabla users:", userData);

            // If customer, create basic customer profile
            if (formData.role === "customer") {
                const currentYear = new Date().getFullYear();
                const drivingExperience = formData.licenseYear 
                    ? currentYear - parseInt(formData.licenseYear) 
                    : null;

                const { data: customerData, error: customerError } =
                    await supabase
                        .from("customers")
                        .insert({
                            user_id: data.user.id,
                            date_of_birth: formData.birthDate || null,
                            driving_experience_years: drivingExperience,
                            // SKIP has_accidents and has_claims if columns don't exist
                        })
                        .select();

                if (customerError) {
                    console.error("Error creando perfil de cliente:", customerError);
                    setError(`Error creando perfil de cliente: ${customerError.message}`);
                    return;
                }

                console.log("Perfil de cliente creado:", customerData);
            }

            setSuccess("Cuenta creada exitosamente. Ya puedes iniciar sesión.");
        }
    } catch (err) {
        console.error("Error inesperado:", err);
        setError(`Error inesperado: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
        setLoading(false);
    }
};