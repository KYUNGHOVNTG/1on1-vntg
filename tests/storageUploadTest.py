import os
from google.cloud import storage

# 1. 인증키 경로 설정
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "gcp-key.json"

def upload_audio_to_gcs(bucket_name, source_file_name, destination_blob_name):
    """
    bucket_name: 내 버킷 이름 (예: 'my-1on1-storage')
    source_file_name: 내 컴퓨터에 있는 파일 경로
    destination_blob_name: 구글 스토리지에 저장될 이름
    """
    # 클라이언트 초기화
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    # 파일 업로드
    blob.upload_from_filename(source_file_name)

    print(f"파일 {source_file_name}이(가) {destination_blob_name}으로 업로드되었습니다.")
    
    # 2. 업로드 후 나중에 접근할 URL 반환
    return blob.public_url

# 실행 예시
# upload_audio_to_gcs("my-bucket", "temp_record.webm", "meetings/001.webm")