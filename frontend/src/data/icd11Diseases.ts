export interface ICD11Disease {
  code: string;
  name: string;
  category: string;
  aliases?: string[];
}

export const icd11Diseases: ICD11Disease[] = [
  // Infectious & Parasitic
  { code: '1F40', name: 'Malaria', category: 'Infectious', aliases: ['malaria', 'falciparum', 'plasmodium'] },
  { code: '1F40.0', name: 'Plasmodium falciparum malaria', category: 'Infectious', aliases: ['falciparum malaria', 'p.falciparum'] },
  { code: '1F40.1', name: 'Plasmodium vivax malaria', category: 'Infectious', aliases: ['vivax malaria', 'p.vivax'] },
  { code: '1A07', name: 'Typhoid fever', category: 'Infectious', aliases: ['typhoid', 'enteric fever', 'salmonella typhi'] },
  { code: '1A09', name: 'Paratyphoid fever', category: 'Infectious', aliases: ['paratyphoid'] },
  { code: '1A00', name: 'Cholera', category: 'Infectious', aliases: ['vibrio cholerae'] },
  { code: '1A20', name: 'Amoebiasis', category: 'Infectious', aliases: ['amoeba', 'amoebic dysentery', 'entamoeba'] },
  { code: '1A22', name: 'Shigellosis', category: 'Infectious', aliases: ['bacterial dysentery', 'shigella', 'dysentery'] },
  { code: '1B10', name: 'Pulmonary tuberculosis', category: 'Infectious', aliases: ['TB', 'tuberculosis', 'PTB', 'Koch'] },
  { code: '1B11', name: 'Miliary tuberculosis', category: 'Infectious', aliases: ['miliary TB', 'disseminated TB'] },
  { code: '1B13', name: 'Tuberculous meningitis', category: 'Infectious', aliases: ['TB meningitis'] },
  { code: '1B96', name: 'Brucellosis', category: 'Infectious', aliases: ['brucella', 'undulant fever'] },
  { code: '1C20', name: 'Candidiasis', category: 'Infectious', aliases: ['candida', 'thrush', 'moniliasis'] },
  { code: '1C62', name: 'HIV disease', category: 'Infectious', aliases: ['HIV', 'AIDS', 'antiretroviral'] },
  { code: '1D00', name: 'Bacterial meningitis', category: 'Infectious', aliases: ['meningitis', 'spinal meningitis'] },
  { code: '1D20', name: 'Viral meningitis', category: 'Infectious', aliases: ['viral meningitis'] },
  { code: '1E32', name: 'Influenza', category: 'Infectious', aliases: ['flu', 'influenza'] },
  { code: '1E90', name: 'Chickenpox', category: 'Infectious', aliases: ['varicella', 'chicken pox'] },
  { code: '1E91', name: 'Herpes zoster', category: 'Infectious', aliases: ['shingles', 'zoster', 'herpes'] },
  { code: '1F03', name: 'Measles', category: 'Infectious', aliases: ['rubeola'] },
  { code: '1F07', name: 'Rubella', category: 'Infectious', aliases: ['german measles'] },
  { code: '1F28', name: 'Dermatophytosis', category: 'Infectious', aliases: ['tinea', 'ringworm', 'tinea corporis', 'tinea capitis', 'tinea pedis'] },
  { code: '1G03', name: 'Scabies', category: 'Infectious', aliases: ['scabies', 'sarcoptes'] },
  { code: '1G40', name: 'Sepsis', category: 'Infectious', aliases: ['sepsis', 'septicaemia', 'blood poisoning'] },
  { code: '1G41', name: 'Septic shock', category: 'Infectious', aliases: ['septic shock'] },
  { code: 'DA96', name: 'Intestinal parasitic infection', category: 'Infectious', aliases: ['worms', 'helminths', 'roundworm', 'tapeworm', 'hookworm', 'ascaris', 'deworming'] },
  { code: 'RA01', name: 'COVID-19', category: 'Infectious', aliases: ['coronavirus', 'SARS-CoV-2', 'covid'] },
  { code: '1B72', name: 'Cellulitis', category: 'Infectious', aliases: ['cellulitis', 'skin infection', 'soft tissue infection'] },

  // Respiratory
  { code: 'CA0Z', name: 'Upper respiratory tract infection (URTI)', category: 'Respiratory', aliases: ['URTI', 'common cold', 'coryza', 'upper respiratory'] },
  { code: 'CA02', name: 'Acute pharyngitis', category: 'Respiratory', aliases: ['pharyngitis', 'sore throat'] },
  { code: 'CA03', name: 'Acute tonsillitis', category: 'Respiratory', aliases: ['tonsillitis', 'tonsils'] },
  { code: 'CA06', name: 'Acute sinusitis', category: 'Respiratory', aliases: ['sinusitis', 'sinus infection'] },
  { code: 'CA40', name: 'Pneumonia', category: 'Respiratory', aliases: ['pneumonia', 'chest infection', 'lobar pneumonia'] },
  { code: 'CA22', name: 'Chronic obstructive pulmonary disease', category: 'Respiratory', aliases: ['COPD', 'chronic bronchitis', 'emphysema'] },
  { code: 'CA23', name: 'Asthma', category: 'Respiratory', aliases: ['asthma', 'bronchial asthma', 'wheeze'] },
  { code: 'AB01', name: 'Acute otitis media', category: 'Respiratory', aliases: ['ear infection', 'otitis media', 'AOM'] },
  { code: 'CA0A', name: 'Laryngitis', category: 'Respiratory', aliases: ['laryngitis', 'hoarse voice'] },

  // Cardiovascular
  { code: 'BA00', name: 'Essential hypertension', category: 'Cardiovascular', aliases: ['hypertension', 'high blood pressure', 'HTN', 'BP'] },
  { code: 'BC43', name: 'Heart failure', category: 'Cardiovascular', aliases: ['heart failure', 'cardiac failure', 'CCF'] },
  { code: 'BD10', name: 'Acute myocardial infarction', category: 'Cardiovascular', aliases: ['heart attack', 'MI', 'myocardial infarction', 'AMI'] },
  { code: 'BA41', name: 'Hypertensive emergency', category: 'Cardiovascular', aliases: ['hypertensive crisis', 'hypertensive emergency'] },

  // Endocrine & Metabolic
  { code: '5A10', name: 'Type 1 diabetes mellitus', category: 'Endocrine', aliases: ['type 1 diabetes', 'insulin dependent diabetes', 'IDDM', 'T1DM'] },
  { code: '5A11', name: 'Type 2 diabetes mellitus', category: 'Endocrine', aliases: ['type 2 diabetes', 'non-insulin dependent', 'NIDDM', 'T2DM', 'diabetes'] },
  { code: '5A23', name: 'Diabetic ketoacidosis', category: 'Endocrine', aliases: ['DKA', 'ketoacidosis'] },
  { code: '5A80', name: 'Hypothyroidism', category: 'Endocrine', aliases: ['hypothyroidism', 'underactive thyroid', 'myxoedema'] },
  { code: '5A00', name: 'Hyperthyroidism', category: 'Endocrine', aliases: ['hyperthyroidism', 'overactive thyroid', 'thyrotoxicosis', 'Graves disease'] },
  { code: '5C50', name: 'Obesity', category: 'Endocrine', aliases: ['obesity', 'overweight'] },
  { code: '5B55', name: 'Vitamin D deficiency rickets', category: 'Nutritional', aliases: ['rickets', 'vitamin D deficiency'] },
  { code: '5B5Z', name: 'Severe acute malnutrition', category: 'Nutritional', aliases: ['malnutrition', 'kwashiorkor', 'marasmus', 'SAM', 'wasting'] },

  // Digestive
  { code: 'MD90', name: 'Acute gastroenteritis', category: 'Digestive', aliases: ['gastroenteritis', 'stomach flu', 'vomiting and diarrhoea', 'diarrhea', 'diarrhoea'] },
  { code: 'DA40', name: 'Peptic ulcer disease', category: 'Digestive', aliases: ['peptic ulcer', 'gastric ulcer', 'duodenal ulcer', 'PUD'] },
  { code: 'DA41', name: 'Acute gastritis', category: 'Digestive', aliases: ['gastritis', 'stomach inflammation'] },
  { code: 'DC80', name: 'Acute appendicitis', category: 'Digestive', aliases: ['appendicitis', 'appendix'] },
  { code: 'DB97', name: 'Intestinal obstruction', category: 'Digestive', aliases: ['bowel obstruction', 'ileus', 'intestinal obstruction'] },
  { code: 'DB96', name: 'Hernia', category: 'Digestive', aliases: ['hernia', 'inguinal hernia', 'umbilical hernia'] },

  // Genitourinary
  { code: 'GC08', name: 'Urinary tract infection', category: 'Genitourinary', aliases: ['UTI', 'cystitis', 'urinary infection', 'bladder infection'] },
  { code: 'GC20', name: 'Acute pyelonephritis', category: 'Genitourinary', aliases: ['kidney infection', 'pyelonephritis'] },
  { code: 'GB60', name: 'Acute kidney injury', category: 'Genitourinary', aliases: ['AKI', 'acute renal failure', 'kidney failure'] },
  { code: 'GA02', name: 'Pelvic inflammatory disease', category: 'Genitourinary', aliases: ['PID', 'pelvic infection'] },
  { code: 'GC21', name: 'Chronic kidney disease', category: 'Genitourinary', aliases: ['CKD', 'chronic renal failure', 'renal failure'] },

  // Musculoskeletal
  { code: 'FA00', name: 'Osteoarthritis', category: 'Musculoskeletal', aliases: ['OA', 'osteoarthritis', 'joint pain', 'degenerative joint'] },
  { code: 'FA20', name: 'Rheumatoid arthritis', category: 'Musculoskeletal', aliases: ['RA', 'rheumatoid arthritis'] },
  { code: 'FB80', name: 'Low back pain', category: 'Musculoskeletal', aliases: ['back pain', 'LBP', 'lumbago', 'lumbar pain'] },
  { code: 'FB56', name: 'Gout', category: 'Musculoskeletal', aliases: ['gout', 'gouty arthritis'] },

  // Neurological
  { code: '8A60', name: 'Epilepsy', category: 'Neurological', aliases: ['epilepsy', 'seizures', 'fits', 'convulsions'] },
  { code: '8A80', name: 'Migraine', category: 'Neurological', aliases: ['migraine', 'migraine headache'] },
  { code: '8B20', name: 'Ischaemic stroke', category: 'Neurological', aliases: ['stroke', 'CVA', 'cerebrovascular accident', 'TIA'] },
  { code: 'MB20', name: 'Headache', category: 'Neurological', aliases: ['headache', 'cephalgia'] },

  // Blood
  { code: '3A00', name: 'Iron deficiency anaemia', category: 'Haematological', aliases: ['anaemia', 'anemia', 'iron deficiency', 'IDA'] },
  { code: '3A51', name: 'Sickle cell disease', category: 'Haematological', aliases: ['SCD', 'sickle cell', 'sickling'] },
  { code: '3A70', name: 'Malaria-related anaemia', category: 'Haematological', aliases: ['malarial anaemia'] },

  // Mental Health
  { code: '6A70', name: 'Depressive episode', category: 'Mental Health', aliases: ['depression', 'MDD', 'major depressive disorder', 'low mood'] },
  { code: '6B00', name: 'Generalised anxiety disorder', category: 'Mental Health', aliases: ['anxiety', 'GAD', 'anxiety disorder'] },
  { code: '6C40', name: 'Alcohol dependence', category: 'Mental Health', aliases: ['alcoholism', 'alcohol dependence', 'alcohol use disorder'] },

  // Obstetrics & Gynaecology
  { code: 'JA24', name: 'Normal delivery', category: 'Obstetrics', aliases: ['normal delivery', 'vaginal delivery', 'SVD', 'normal labour', 'NVD', 'childbirth'] },
  { code: 'JB0B', name: 'Caesarean section', category: 'Obstetrics', aliases: ['C/S', 'caesarean', 'cesarean', 'C-section'] },
  { code: 'JA65', name: 'Pre-eclampsia', category: 'Obstetrics', aliases: ['pre-eclampsia', 'preeclampsia', 'PIH', 'gestational hypertension'] },
  { code: 'JA65.1', name: 'Eclampsia', category: 'Obstetrics', aliases: ['eclampsia', 'fits in pregnancy'] },
  { code: 'JB06', name: 'Postpartum haemorrhage', category: 'Obstetrics', aliases: ['PPH', 'postpartum haemorrhage', 'post-delivery bleeding'] },
  { code: 'JB08', name: 'Obstructed labour', category: 'Obstetrics', aliases: ['obstructed labour', 'prolonged labour', 'CPD'] },
  { code: 'JA00', name: 'Ectopic pregnancy', category: 'Obstetrics', aliases: ['ectopic', 'ectopic pregnancy'] },
  { code: 'JA04', name: 'Spontaneous abortion', category: 'Obstetrics', aliases: ['miscarriage', 'spontaneous abortion', 'threatened abortion'] },
  { code: 'JA63', name: 'Gestational diabetes mellitus', category: 'Obstetrics', aliases: ['GDM', 'gestational diabetes', 'diabetes in pregnancy'] },
  { code: 'JA65.0', name: 'Anaemia in pregnancy', category: 'Obstetrics', aliases: ['anaemia in pregnancy', 'pregnancy anaemia'] },

  // Neonatal/Paediatric
  { code: 'KA20', name: 'Birth asphyxia', category: 'Neonatal', aliases: ['birth asphyxia', 'perinatal asphyxia', 'neonatal asphyxia'] },
  { code: 'KB23', name: 'Neonatal jaundice', category: 'Neonatal', aliases: ['neonatal jaundice', 'newborn jaundice', 'hyperbilirubinaemia'] },
  { code: 'KA60', name: 'Neonatal sepsis', category: 'Neonatal', aliases: ['neonatal sepsis', 'newborn sepsis'] },
  { code: 'KB23.1', name: 'Neonatal pneumonia', category: 'Neonatal', aliases: ['neonatal pneumonia', 'newborn pneumonia'] },

  // Skin
  { code: 'EA80', name: 'Urticaria', category: 'Skin', aliases: ['urticaria', 'hives', 'allergic rash', 'angioedema'] },
  { code: '9A60', name: 'Conjunctivitis', category: 'Eye', aliases: ['conjunctivitis', 'pink eye', 'red eye'] },

  // Injuries
  { code: 'ND50', name: 'Head injury', category: 'Injury', aliases: ['head injury', 'traumatic brain injury', 'TBI', 'concussion'] },
  { code: 'NB91', name: 'Fracture', category: 'Injury', aliases: ['fracture', 'broken bone', 'bone fracture'] },
  { code: 'NG50', name: 'Burns', category: 'Injury', aliases: ['burns', 'burn injury', 'thermal injury'] },
];
