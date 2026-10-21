// Адрес и публичный ключ проекта Supabase для совместной игры.
// Оба значения не секретные: они видны любому посетителю сайта. Ключ service_role сюда класть нельзя.
// Можно задать при сборке через VITE_SUPABASE_URL и VITE_SUPABASE_KEY.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? 'https://ypfonyqjycmuremjejrp.supabase.co';
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_VhL95B76NgwGq4LYPTC61A_Gy9UZQQR';
