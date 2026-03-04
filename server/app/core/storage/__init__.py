"""
Core Storage Module

파일 스토리지 관련 유틸리티를 제공합니다.
현재: Google Cloud Storage (GCS) 연동
"""

from .gcs import GCSClient, get_gcs_client

__all__ = ["GCSClient", "get_gcs_client"]
