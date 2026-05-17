-- Revoke execute from public/anon/authenticated roles for security definer function
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated;

-- Grant execute to service_role and other necessary internal roles if needed, 
-- but SECURITY DEFINER functions are usually called by triggers or policies 
-- where the owner (postgres) already has permission.
