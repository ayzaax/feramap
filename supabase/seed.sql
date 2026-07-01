-- Seed data for colonies (neighborhoods of Ciudad Lerdo)
insert into public.colonies (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'Centro (Lerdo)', 'Downtown Ciudad Lerdo area'),
  ('a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e1', 'Villa Jardín', 'Colonia Villa Jardín in Lerdo'),
  ('a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e2', 'San Isidro', 'Colonia San Isidro in Lerdo'),
  ('a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e3', 'Las Flores', 'Colonia Las Flores in Lerdo'),
  ('a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e4', 'Miguel Hidalgo', 'Colonia Miguel Hidalgo in Lerdo'),
  ('a0a0a0a0-b0b0-c0c0-d0d0-e0e0e0e0e0e5', 'Bella Vista', 'Colonia Bella Vista in Lerdo')
on conflict (id) do nothing;
