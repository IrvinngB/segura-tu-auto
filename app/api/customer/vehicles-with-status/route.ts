import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    // 1. Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // 3. Get all vehicles for this customer
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      return NextResponse.json({ error: 'Error fetching vehicles' }, { status: 500 });
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json([]);
    }

    const vehicleIds = vehicles.map(v => v.id);

    // 4. Fetch latest policies for these vehicles
    // We fetch all policies for these vehicles and then process them in memory
    // to find the latest one for each vehicle.
    const { data: policies, error: policiesError } = await supabase
      .from('policies')
      .select('vehicle_id, status, created_at')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      // Continue without policy info? Or fail? Better to fail or warn.
    }

    // 5. Fetch latest quotes for these vehicles
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('vehicle_id, status, created_at')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
    }

    // 6. Process and combine data
    const vehiclesWithStatus = vehicles.map(vehicle => {
      // Find latest policy
      const vehiclePolicies = policies?.filter(p => p.vehicle_id === vehicle.id) || [];
      const latestPolicy = vehiclePolicies.length > 0 ? vehiclePolicies[0] : null;
      
      // Find latest quote
      const vehicleQuotes = quotes?.filter(q => q.vehicle_id === vehicle.id) || [];
      const latestQuote = vehicleQuotes.length > 0 ? vehicleQuotes[0] : null;

      const latestPolicyStatus = latestPolicy?.status || null;
      const latestQuoteStatus = latestQuote?.status || null;

      console.log(`🚗 Vehicle ${vehicle.id} (${vehicle.make} ${vehicle.model}):`, {
        latestPolicyStatus,
        latestQuoteStatus,
        policyCount: vehiclePolicies.length,
        quoteCount: vehicleQuotes.length
      });

      // Calculate quoteAvailability
      let quoteAvailability: 'ACTIVE_POLICY' | 'PENDING_QUOTE' | 'APPROVED_QUOTE' | 'AVAILABLE' = 'AVAILABLE';

      if (latestPolicyStatus === 'active' || latestPolicyStatus === 'suspended') {
        quoteAvailability = 'ACTIVE_POLICY';
      } else if (latestQuoteStatus === 'pending') {
        quoteAvailability = 'PENDING_QUOTE';
      } else if (latestPolicyStatus === 'approved' || latestQuoteStatus === 'approved') {
        // If policy is approved (waiting for payment) OR quote is approved (but not converted yet?)
        // When a quote is approved by agent, it becomes 'converted' and a policy is created with 'approved' status.
        quoteAvailability = 'APPROVED_QUOTE';
      } else {
        quoteAvailability = 'AVAILABLE';
      }

      return {
        ...vehicle,
        latestPolicyStatus,
        latestQuoteStatus,
        quoteAvailability,
      };
    });

    return NextResponse.json(vehiclesWithStatus);

  } catch (error) {
    console.error('Unexpected error in vehicles-with-status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
