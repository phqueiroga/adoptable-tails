with seed_data as (
  select * from (values
    ('Bran','dog','Terrier mix','adult','male','small','medium',true,false,true,true,true,5,'first_time',false,'Dublin','Friendly and curious; enjoys steady walks and a calm home.'),
    ('Saoirse','cat','Domestic shorthair','adult','female','small','low',true,false,true,false,true,7,'first_time',false,'Dublin','Quiet indoor cat who enjoys window watching and gentle company.'),
    ('Finn','dog','Lurcher mix','young','male','large','high',false,true,true,true,false,3,'some',false,'Kildare','Playful young dog who needs daily exercise and secure outdoor space.'),
    ('Nell','cat','Domestic longhair','senior','female','small','low',true,false,true,false,false,6,'some',true,'Wicklow','Gentle senior cat who needs regular coat care and medication.'),
    ('Rua','dog','Collie mix','adult','female','medium','high',false,true,false,true,true,4,'experienced',false,'Meath','Bright, energetic dog who enjoys training and structured activity.'),
    ('Oisín','cat','Domestic shorthair','young','male','small','medium',true,false,true,true,true,5,'first_time',false,'Louth','Sociable young cat who likes games and other friendly animals.'),
    ('Molly','dog','Cocker Spaniel mix','adult','female','medium','medium',true,false,true,true,true,4,'some',false,'Dublin','Affectionate companion who enjoys moderate walks and company.'),
    ('Tadhg','cat','Domestic shorthair','adult','male','small','low',true,false,false,false,false,8,'experienced',false,'Kildare','Independent indoor cat seeking a quiet adult household.'),
    ('Luna','dog','Greyhound','adult','female','large','low',true,false,true,true,true,6,'first_time',false,'Wicklow','Calm retired greyhound who enjoys short walks and long naps.'),
    ('Pip','cat','Domestic shorthair','baby','male','small','high',true,false,true,true,true,3,'some',false,'Dublin','Confident kitten who needs play, supervision, and companionship.'),
    ('Clover','dog','Beagle mix','young','female','medium','high',false,true,true,true,true,3,'some',false,'Meath','Inquisitive young dog who loves scent games and active outings.'),
    ('Miso','cat','Domestic shorthair','adult','female','small','medium',true,false,true,false,true,6,'first_time',false,'Dublin','Warm, playful cat who settles well into indoor routines.'),
    ('Murphy','dog','Labrador mix','senior','male','large','low',false,false,true,true,true,5,'some',true,'Louth','Kind senior dog managing arthritis with gentle exercise and care.'),
    ('Aoife','cat','Domestic longhair','young','female','small','medium',true,false,true,false,false,5,'some',false,'Kildare','Sensitive young cat who thrives with patient introductions.'),
    ('Scout','dog','Jack Russell mix','adult','male','small','high',true,false,false,false,false,4,'experienced',false,'Dublin','Clever, lively terrier seeking an experienced adult home.'),
    ('Willow','cat','Domestic shorthair','senior','female','small','low',true,false,true,false,true,8,'first_time',false,'Wicklow','Relaxed senior cat who enjoys sunny spots and a predictable day.'),
    ('Benji','dog','Poodle mix','adult','male','small','medium',true,false,true,true,true,5,'first_time',false,'Dublin','People-focused small dog who enjoys training and neighbourhood walks.'),
    ('Freya','cat','Domestic shorthair','adult','female','small','low',true,false,false,false,false,7,'some',false,'Meath','Reserved cat looking for a peaceful home without other animals.'),
    ('Max','dog','German Shepherd mix','adult','male','large','high',false,true,false,true,false,3,'experienced',false,'Kildare','Loyal working-breed mix who needs confident handling and enrichment.'),
    ('Peanut','cat','Domestic shorthair','young','male','small','high',true,false,true,true,true,4,'first_time',false,'Louth','Cheerful young cat who enjoys toys and friendly household activity.'),
    ('Rosie','dog','Bichon mix','senior','female','small','low',true,false,true,true,true,5,'some',true,'Dublin','Sweet older dog requiring routine eye care and gentle exercise.'),
    ('Dexter','cat','Domestic shorthair','adult','male','small','medium',true,false,true,false,true,6,'first_time',false,'Wicklow','Confident indoor cat who enjoys interactive play and quiet evenings.'),
    ('Bonnie','dog','Collie mix','young','female','medium','high',false,true,true,true,true,3,'some',false,'Meath','Enthusiastic learner who needs exercise, games, and continued training.'),
    ('Seamus','cat','Domestic longhair','adult','male','small','low',true,false,true,false,false,7,'some',false,'Dublin','Fluffy, calm cat who prefers being the only animal in the home.'),
    ('Daisy','dog','Staffordshire mix','adult','female','medium','medium',true,false,true,true,false,5,'some',false,'Louth','Affectionate dog who enjoys people and should live without cats.'),
    ('Nora','cat','Domestic shorthair','baby','female','small','high',true,false,true,true,true,3,'some',false,'Kildare','Curious kitten who needs a playful and attentive household.'),
    ('Alfie','dog','Whippet mix','adult','male','medium','medium',true,false,true,true,true,5,'first_time',false,'Dublin','Gentle dog who enjoys comfortable indoor living and daily walks.'),
    ('Maeve','cat','Domestic shorthair','adult','female','small','low',true,false,true,false,true,7,'first_time',false,'Meath','Easy-going indoor cat who likes calm companionship.'),
    ('Cooper','dog','Retriever mix','young','male','large','high',false,true,true,true,true,3,'some',false,'Wicklow','Happy, energetic dog who needs space, training, and active days.'),
    ('Ivy','cat','Domestic shorthair','senior','female','small','low',true,false,true,false,false,8,'some',true,'Dublin','Quiet senior cat on a managed renal diet, seeking a calm home.'),
    ('Rex','dog','Terrier mix','adult','male','small','medium',true,false,true,false,true,5,'some',false,'Kildare','Engaging small dog who prefers not to share with another dog.'),
    ('Cleo','cat','Domestic shorthair','young','female','small','medium',true,false,true,true,true,5,'first_time',false,'Louth','Friendly young cat who adapts well with careful introductions.'),
    ('Harvey','dog','Greyhound','senior','male','large','low',true,false,true,true,true,6,'first_time',false,'Dublin','Mellow older greyhound who values soft beds and relaxed walks.'),
    ('Ziggy','cat','Domestic shorthair','adult','male','small','high',true,false,false,false,false,5,'experienced',false,'Wicklow','Busy, clever cat who needs enrichment and an adult-only home.'),
    ('Ruby','dog','Spaniel mix','adult','female','medium','high',false,true,true,true,true,4,'some',false,'Meath','Active, affectionate dog who loves outdoor adventures and games.'),
    ('Oscar','cat','Domestic shorthair','adult','male','small','low',true,false,true,false,true,7,'first_time',false,'Dublin','Content indoor cat who enjoys a steady routine and gentle attention.'),
    ('Millie','dog','Maltese mix','young','female','small','medium',true,false,true,true,true,4,'some',false,'Louth','Bright small dog who enjoys company and positive training.'),
    ('Fionn','cat','Domestic longhair','adult','male','small','medium',true,false,true,false,false,6,'some',false,'Kildare','Handsome long-haired cat who prefers a quiet single-pet home.'),
    ('Honey','dog','Labrador mix','adult','female','large','medium',false,false,true,true,true,5,'first_time',false,'Dublin','Steady family companion who enjoys walks, play, and social time.'),
    ('Poppy','cat','Domestic shorthair','young','female','small','high',true,false,true,true,true,4,'first_time',false,'Wicklow','Playful and outgoing cat who enjoys an active household.')
  ) as t(name,species,breed,age_group,sex,size,activity_level,apartment_suitable,
    garden_required,good_with_children,good_with_dogs,good_with_cats,max_alone_hours,
    experience_required,special_needs,location,description)
)
insert into public.animals (
  name,species,breed,age_group,sex,size,activity_level,apartment_suitable,
  garden_required,good_with_children,good_with_dogs,good_with_cats,max_alone_hours,
  experience_required,special_needs,location,description,available_since
)
select *, current_date - ((row_number() over ())::int % 30)
from seed_data;
