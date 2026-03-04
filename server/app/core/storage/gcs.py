"""
Google Cloud Storage (GCS) 연동 모듈

기능:
- GCS 클라이언트 싱글톤 제공
- Presigned Upload URL 생성 (프론트엔드 직접 업로드용)
- Presigned Download URL 생성 (오디오 재생용)
- 파일 다운로드 (AI 파이프라인 내부 처리용)

GCS 경로 규칙:
    meetings/{leader_emp_no}/{meeting_id}/original_audio.webm
"""

import datetime
from functools import lru_cache
from typing import Optional

from google.cloud import storage
from google.oauth2 import service_account

from server.app.core.config import get_settings
from server.app.core.logging import get_logger
from server.app.shared.exceptions import ExternalServiceException

logger = get_logger(__name__)
settings = get_settings()


class GCSClient:
    """
    Google Cloud Storage 클라이언트 싱글톤

    Presigned URL 생성 및 파일 조작을 담당합니다.
    서비스 계정 인증 방식을 사용합니다.
    """

    def __init__(self) -> None:
        self._client: Optional[storage.Client] = None
        self._bucket_name: str = settings.GCS_BUCKET_NAME

    def _get_client(self) -> storage.Client:
        """GCS 클라이언트 초기화 (지연 로딩)"""
        if self._client is None:
            try:
                credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS
                if credentials_path:
                    credentials = service_account.Credentials.from_service_account_file(
                        credentials_path,
                        scopes=["https://www.googleapis.com/auth/cloud-platform"],
                    )
                    self._client = storage.Client(
                        project=settings.GCS_PROJECT_ID,
                        credentials=credentials,
                    )
                else:
                    # Application Default Credentials (ADC) 사용
                    self._client = storage.Client(project=settings.GCS_PROJECT_ID)
            except Exception as e:
                logger.error(f"GCS 클라이언트 초기화 실패: {e}")
                raise ExternalServiceException(
                    "GCS 클라이언트 초기화에 실패했습니다. 서비스 계정 설정을 확인하세요."
                )
        return self._client

    def _get_blob(self, gcs_path: str) -> storage.Blob:
        """GCS Blob 객체 반환"""
        client = self._get_client()
        bucket = client.bucket(self._bucket_name)
        return bucket.blob(gcs_path)

    @staticmethod
    def build_audio_path(leader_emp_no: str, meeting_id: str) -> str:
        """
        오디오 파일 GCS 경로 생성

        경로 규칙: meetings/{leader_emp_no}/{meeting_id}/original_audio.webm
        """
        return f"meetings/{leader_emp_no}/{meeting_id}/original_audio.webm"

    async def generate_upload_presigned_url(
        self,
        leader_emp_no: str,
        meeting_id: str,
        expiration_seconds: int = 3600,
    ) -> dict[str, str]:
        """
        GCS Presigned Upload URL 생성

        프론트엔드가 PUT 요청으로 직접 GCS에 오디오 파일을 업로드할 때 사용합니다.

        Args:
            leader_emp_no: 리더 사원번호 (경로 구성용)
            meeting_id: 미팅 UUID (경로 구성용)
            expiration_seconds: URL 만료 시간 (초, 기본 1시간)

        Returns:
            dict: { "presigned_url": str, "gcs_path": str, "expires_at": str }
        """
        gcs_path = self.build_audio_path(leader_emp_no, meeting_id)

        try:
            blob = self._get_blob(gcs_path)
            expiration = datetime.timedelta(seconds=expiration_seconds)

            presigned_url = blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="PUT",
                content_type="audio/webm",
            )

            expires_at = (
                datetime.datetime.utcnow() + expiration
            ).isoformat() + "Z"

            logger.info(f"Presigned upload URL 생성 완료: meeting_id={meeting_id}, path={gcs_path}")
            return {
                "presigned_url": presigned_url,
                "gcs_path": gcs_path,
                "expires_at": expires_at,
            }

        except ExternalServiceException:
            raise
        except Exception as e:
            logger.error(f"Presigned upload URL 생성 실패: meeting_id={meeting_id}, error={e}")
            raise ExternalServiceException("업로드 URL 생성에 실패했습니다.")

    async def generate_download_presigned_url(
        self,
        gcs_path: str,
        expiration_seconds: int = 3600,
    ) -> str:
        """
        GCS Presigned Download URL 생성

        오디오 재생용 임시 URL을 발급합니다.
        매 요청마다 새로 발급하며 캐싱하지 않습니다.

        Args:
            gcs_path: GCS 내 파일 경로
            expiration_seconds: URL 만료 시간 (초, 기본 1시간)

        Returns:
            str: Presigned Download URL
        """
        try:
            blob = self._get_blob(gcs_path)
            expiration = datetime.timedelta(seconds=expiration_seconds)

            presigned_url = blob.generate_signed_url(
                version="v4",
                expiration=expiration,
                method="GET",
            )

            logger.info(f"Presigned download URL 생성 완료: path={gcs_path}")
            return presigned_url

        except ExternalServiceException:
            raise
        except Exception as e:
            logger.error(f"Presigned download URL 생성 실패: path={gcs_path}, error={e}")
            raise ExternalServiceException("다운로드 URL 생성에 실패했습니다.")

    async def download_file(self, gcs_path: str) -> bytes:
        """
        GCS 파일 다운로드 (AI 파이프라인 내부 처리용)

        서비스 계정 권한으로 직접 파일을 다운로드합니다.
        Presigned URL 방식이 아닌 서버 사이드 직접 다운로드입니다.

        Args:
            gcs_path: GCS 내 파일 경로

        Returns:
            bytes: 파일 바이너리 데이터

        Raises:
            ExternalServiceException: 파일이 존재하지 않거나 다운로드 실패 시
        """
        try:
            blob = self._get_blob(gcs_path)

            if not blob.exists():
                logger.error(f"GCS 파일이 존재하지 않음: path={gcs_path}")
                raise ExternalServiceException(f"GCS 파일을 찾을 수 없습니다: {gcs_path}")

            file_bytes = blob.download_as_bytes()
            logger.info(f"GCS 파일 다운로드 완료: path={gcs_path}, size={len(file_bytes)} bytes")
            return file_bytes

        except ExternalServiceException:
            raise
        except Exception as e:
            logger.error(f"GCS 파일 다운로드 실패: path={gcs_path}, error={e}")
            raise ExternalServiceException("파일 다운로드에 실패했습니다.")

    async def file_exists(self, gcs_path: str) -> bool:
        """
        GCS 파일 존재 여부 확인

        Args:
            gcs_path: GCS 내 파일 경로

        Returns:
            bool: 파일 존재 여부
        """
        try:
            blob = self._get_blob(gcs_path)
            return blob.exists()
        except Exception as e:
            logger.error(f"GCS 파일 존재 확인 실패: path={gcs_path}, error={e}")
            return False


@lru_cache()
def get_gcs_client() -> GCSClient:
    """
    GCS 클라이언트 싱글톤 반환

    애플리케이션 생명주기 동안 단일 인스턴스를 공유합니다.

    Returns:
        GCSClient: GCS 클라이언트 인스턴스
    """
    return GCSClient()
