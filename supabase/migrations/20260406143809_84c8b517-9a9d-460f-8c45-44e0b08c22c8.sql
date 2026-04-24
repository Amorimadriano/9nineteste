-- Attach the existing create_trial_on_signup function as a trigger on auth.users
CREATE TRIGGER on_auth_user_created_trial
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_trial_on_signup();