import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

with open('cities.json', 'r', encoding='utf-8') as f:
    cities_data = json.load(f)

cities_map = {city['name'].lower(): city for city in cities_data}

@app.route('/cities', methods=['GET'])
def get_cities():
    city_names = [city['name'] for city in cities_data]
    return jsonify(city_names)

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        lived_city_name = data['lived_city'].lower()
        dream_city_name = data['dream_city'].lower()
        priority = data['priority']

        lived_city = cities_map.get(lived_city_name)
        dream_city = cities_map.get(dream_city_name)

        if not lived_city or not dream_city:
            return jsonify({"error": "입력하신 도시를 찾을 수 없습니다. 목록에서 도시를 선택해주세요."}), 404

        # --- [개선된 알고리즘] ---
        # 1. 사용자 취향 프로필 생성
        user_profile = {}
        all_features = set(lived_city['features'].keys()) | set(dream_city['features'].keys())
        for feature in all_features:
            lived_score = lived_city['features'].get(feature, 0)
            dream_score = dream_city['features'].get(feature, 0)
            user_profile[feature] = (lived_score + dream_score) / 2

        # 2. 우선순위 가중치 강화 (기존 1.5 -> 2.0)
        priority_weight = 2.0
        if priority in user_profile:
            user_profile[priority] *= priority_weight

        # 3. 후보 도시와 유사도 계산
        best_match = None
        max_score = -1

        candidate_cities = [c for c in cities_data if c['name'].lower() not in [lived_city_name, dream_city_name]]

        for candidate in candidate_cities:
            # 기본 유사도 점수 계산
            similarity_score = 0
            for feature, user_score in user_profile.items():
                candidate_score = candidate['features'].get(feature, 0)
                similarity_score += user_score * candidate_score
            
            # 4. 우선순위 '부스트' 적용
            # 후보 도시가 사용자의 우선순위 항목에서 가진 점수 자체를 보너스로 추가
            priority_boost = candidate['features'].get(priority, 0)
            
            # 최종 점수 = 기본 유사도 점수 + (보너스 점수 * 가중치)
            # 가중치를 2정도로 주어 부스트 효과를 극대화
            final_score = similarity_score + (priority_boost * 2)

            if final_score > max_score:
                max_score = final_score
                best_match = candidate
        # --- [알고리즘 종료] ---

        if not best_match:
            return jsonify({"error": "추천할 만한 도시를 찾지 못했습니다."}), 404

        return jsonify(best_match)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)