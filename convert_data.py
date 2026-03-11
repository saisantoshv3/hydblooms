import csv
import json

common_names = {
    "Cassia fistula": "Golden Shower Tree (Rela)",
    "Peltophorum pterocarpum": "Copperpod (Kondachinta)",
    "Plumeria alba": "White Frangipani (Champa)",
    "Azadirachta indica": "Neem (Vepa)",
    "Spathodea campanulata": "African Tulip Tree (Patadi)",
    "Delonix regia": "Gulmohar",
    "Ficus religiosa": "Peepal",
    "Ficus benghalensis": "Banyan",
    "Tamarindus indica": "Tamarind",
    "Mangifera indica": "Mango",
    "Polyalthia longifolia": "Ashoka",
    "Terminalia catappa": "Indian Almond",
    "Millingtonia hortensis": "Indian Cork Tree",
    "Bauhinia purpurea": "Purple Orchid Tree",
    "Jacaranda mimosifolia": "Jacaranda",
    "Tabebuia rosea": "Pink Trumpet Tree",
    "Lagerstroemia speciosa": "Pride of India",
    "Albizia lebbeck": "Siris",
    "Alstonia scholaris": "Scholar Tree",
    "Bombax ceiba": "Silk Cotton Tree",
    "Butea monosperma": "Flame of the Forest",
    "Callistemon": "Bottlebrush",
    "Casuarina equisetifolia": "Casuarina",
    "Eucalyptus": "Nilgiri",
    "Leucaena leucocephala": "Subabul",
    "Michelia champaca": "Champak",
    "Mimusops elengi": "Bakul",
    "Moringa oleifera": "Drumstick",
    "Nyctanthes arbor-tristis": "Parijat",
    "Phoenix sylvestris": "Silver Date Palm",
    "Pongamia pinnata": "Karanj",
    "Prosopis juliflora": "Vilayati Kikar",
    "Psidium guajava": "Guava",
    "Punica granatum": "Pomegranate",
    "Roystonea regia": "Royal Palm",
    "Santalum album": "Sandalwood",
    "Syzygium cumini": "Jamun",
    "Tectona grandis": "Teak",
    "Thespesia populnea": "Indian Tulip Tree",
    "Ziziphus mauritiana": "Ber"
}

def convert():
    csv_file = "/Users/apple/Desktop/projects/hydblooms/data/merged_all.csv"
    data = []
    
    with open(csv_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sc_name = row.get("scientificName", "").strip()
            kingdom = row.get("kingdom", "").strip().capitalize()
            
            # Special case for "Plantae" records that don't have a species name
            if not sc_name or sc_name.lower() == "plantae":
                sc_name = "Undetermined Tree" if kingdom == "Plantae" else f"Undetermined {kingdom}"
                
            common_name = common_names.get(sc_name, sc_name)
            
            # Extract necessary fields with updated headers
            tree = {
                "id": row.get("id"),
                "scientificName": sc_name,
                "commonName": common_name,
                "kingdom": kingdom,
                "lat": float(row.get("decimalLatitude")) if row.get("decimalLatitude") else None,
                "lng": float(row.get("decimalLongitude")) if row.get("decimalLongitude") else None,
                "locality": row.get("locality"),
                "date": row.get("eventDate_event") or row.get("eventDate_occurrence"),
                "count": row.get("individualCount") or "1",
                "remarks": row.get("organismRemarks"),
                "recordedBy": row.get("recordedBy")
            }
            if tree["lat"] and tree["lng"]:
                data.append(tree)
                
    with open("trees.json", "w") as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    convert()
