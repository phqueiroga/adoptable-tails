insert into public.animals (
  name, species, breed, age_group, sex, size, activity_level,
  apartment_suitable, garden_required, good_with_children, good_with_dogs,
  good_with_cats, max_alone_hours, experience_required, special_needs,
  location, description, available_since
) values
  ('Mara','dog','Mixed breed','adult','female','small','low',true,false,true,true,true,10,'first_time',false,'Dublin','Small adult dog recorded with low activity needs. Individual behaviour and household fit must be confirmed with the shelter.',current_date),
  ('Theo','dog','Mixed breed','adult','male','medium','medium',true,false,true,true,true,10,'first_time',false,'Kildare','Medium adult dog recorded with medium activity needs. Individual behaviour and household fit must be confirmed with the shelter.',current_date),
  ('Skye','dog','Mixed breed','young','female','large','high',true,false,true,true,true,10,'first_time',false,'Wicklow','Large young dog recorded with high activity needs. Individual behaviour and household fit must be confirmed with the shelter.',current_date);
