import urllib.request
import json
from server.auth import create_access_token

def insert_via_api():
    token = create_access_token(data={"sub": "admin", "role": "ADMIN"})
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    sponsors_data = [
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Gubbala Lakshmi, Son Durga Prasad, Raji (శ్రీ గుబ్బల లక్ష్మి, కుమారుడు దుర్గా ప్రసాద్, రాజీ)",
                "item_name": "Ksheerannam (క్షీరాన్నం)",
                "notes": "Sweet Milk Rice Annadanam Prasadam"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Vanamala Srinu, Chadalada Srinu, Chadalada Venkateswara Rao, Kumpatla Anjaneyulu, Tirumala Konda Babu (శ్రీ వనమాల శ్రీను, చదలాడ శ్రీను, చదలాడ వెంకటేశ్వరరావు, కుంపట్ల ఆంజనేయులు, తిరుముల కొండ బాబు)",
                "item_name": "Poori (పూరి / బురి)",
                "notes": "Annadanam Tiffin & Prasadam"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Smt. Chelluboyina Satyavathi (శ్రీమతి చెల్లుబోయిన సత్యవతి)",
                "item_name": "Sweet / Delicacy (మధురమైనది)",
                "notes": "Traditional Sweet Prasadam"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Nunnaboyina Vijaya Bhaskar & Swathi (శ్రీ నున్నబోయిన విజయభాస్కర్, స్వాతి గారు)",
                "item_name": "Pulihora (పులిహోర)",
                "notes": "Tamarind Rice Holy Prasadam"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Goli Brihaspathi & Satyavathi (శ్రీ గోలి బృహస్పతి, సత్యవతి గారు)",
                "item_name": "Pappu Mamidikaya (పప్పు మామిడికాయ)",
                "notes": "Mango Dal for Community Annadanam"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Geddada Jayaram, Jyothi & Geddada Dhanuj Kumar (శ్రీ గెద్దాడ జయరామ్, జ్యోతి, గెద్దాడ ధనుజ్ కుమార్)",
                "item_name": "Vankaya Jeedipappu (వంకాయ జీడిపప్పు)",
                "notes": "Brinjal Cashew Special Curry"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Gubbala Ratna Sekhar Reddy & Venkata Ramanamma (శ్రీ గుబ్బల రత్నశేఖర్ రెడ్డి, వెంకట రమణమ్మ గారు)",
                "item_name": "Gongura Chutney (గోంగూర పచ్చడి)",
                "notes": "Traditional Andhra Gongura Chutney"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Gubbala Satya Sai Babu & Sujatha (శ్రీ గుబ్బల సత్య సాయి బాబు, సుజాత గారు)",
                "item_name": "Kandi Podi, Ghee & Mirapakaya Pachadi (కంది పొడి, నెయ్యి, మిరపకాయ పచ్చడి)",
                "notes": "Gunpowder, Pure Ghee & Chilli Chutney for Annadanam"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Gubbala Jyothi Prasad & Madhavi (శ్రీ గుబ్బల జ్యోతి ప్రసాద్, మాధవి గారు)",
                "item_name": "50L Curd (50లీ పెరుగు)",
                "notes": "50 Litres Fresh Curd for Community Meal"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Gubbala Satyanarayana & Srinivas (Bujji) (శ్రీ గుబ్బల సత్యనారాయణ, శ్రీనివాస్ బుజ్జి)",
                "item_name": "Bananas / Fruits (అరటి పండ్లు)",
                "notes": "Pooja & Prasadam Bananas"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Bonthu Satyanarayana, Durgadevi & Pitani Srinivas, Nageswari (బొంతు సత్యనారాయణ, దుర్గాదేవి, పితాని శ్రీనివాస్, నాగేశ్వరి గారు)",
                "item_name": "Meal Plates (భోజనం ప్లేట్లు)",
                "notes": "Dining plates for Annadanam devotees"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Kodigudla Chowdary Garu (కోడిగుడ్ల చౌదరి గారు)",
                "item_name": "Glass Bangles (గాజులు)",
                "notes": "Sacred Pooja Bangles"
            })
        },
        {
            "user_id": 1,
            "amount": 0,
            "date": "2025-08-27",
            "payment_method": "IN_KIND",
            "status": "PAID",
            "notes": json.dumps({
                "sponsor_name": "Sri Kancharla Sekhar Garu (శ్రీ కంచర్ల శేఖర్ గారు)",
                "item_name": "2 Gas Cylinders (2 గ్యాస్ బండలు)",
                "notes": "Cooking Gas for Annadanam Kitchen"
            })
        }
    ]

    targets = ["http://127.0.0.1:8000", "https://team-garuda.onrender.com"]
    for base_url in targets:
        print(f"\n--- Inserting into {base_url} ---")
        count = 0
        for item in sponsors_data:
            try:
                req = urllib.request.Request(
                    f"{base_url}/api/committee/sponsorships",
                    data=json.dumps(item).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status in (200, 201):
                        count += 1
            except Exception as e:
                print(f"Error inserting item: {e}")
        print(f"Inserted {count} item sponsorships into {base_url}")

if __name__ == "__main__":
    insert_via_api()
