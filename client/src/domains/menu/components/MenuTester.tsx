/**
 * Menu Store 테스트 예제 컴포넌트
 * 
 * 개발 중 메뉴 시스템을 테스트하기 위한 컴포넌트입니다.
 * 실제 프로덕션에서는 사용하지 마세요.
 */

import React from 'react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useMenuStore } from '@/domains/menu';

export const MenuTester: React.FC = () => {
    const { user, setUser, isAuthenticated } = useAuthStore();
    const { menus, loading, error, fetchUserMenus } = useMenuStore();

    // 테스트 사용자 데이터
    const testUsers = [
        {
            id: 'user001',
            email: 'admin@example.com',
            name: '관리자',
            position_code: 'P001', // CEO 권한
        },
        {
            id: 'user002',
            email: 'manager@example.com',
            name: '매니저',
            position_code: 'P002', // 팀장 권한
        },
        {
            id: 'user003',
            email: 'member@example.com',
            name: '팀원',
            position_code: 'P003', // 팀원 권한
        },
    ];

    const handleLogin = (testUser: typeof testUsers[0]) => {
        setUser(testUser);
    };

    const handleFetchMenus = () => {
        if (user?.id && user?.position_code) {
            fetchUserMenus(user.id, user.position_code);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">메뉴 시스템 테스트</h2>

                {/* 사용자 선택 */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">테스트 사용자 선택</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {testUsers.map((testUser) => (
                            <button
                                key={testUser.id}
                                onClick={() => handleLogin(testUser)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${user?.id === testUser.id
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-bold">{testUser.name}</div>
                                <div className="text-xs opacity-70">{testUser.position_code}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 현재 사용자 정보 */}
                {isAuthenticated && user && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">현재 로그인 사용자</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>ID: {user.id}</div>
                            <div>이름: {user.name}</div>
                            <div>직책 코드: {user.position_code}</div>
                        </div>
                    </div>
                )}

                {/* 메뉴 조회 버튼 */}
                <div className="mt-4">
                    <button
                        onClick={handleFetchMenus}
                        disabled={!user || loading}
                        className="px-5 py-2.5 bg-[#5B5FED] hover:bg-[#4f53d1] text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '로딩 중...' : '메뉴 조회'}
                    </button>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* 메뉴 결과 */}
                {menus.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            조회된 메뉴 ({menus.length}개)
                        </h3>
                        <div className="space-y-2">
                            {menus.map((menu) => (
                                <MenuTreeItem key={menu.menu_code} menu={menu} level={0} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/** 메뉴 트리 아이템 (재귀적 표시) */
interface MenuTreeItemProps {
    menu: any;
    level: number;
}

const MenuTreeItem: React.FC<MenuTreeItemProps> = ({ menu, level }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div>
            <div
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                style={{ marginLeft: `${level * 20}px` }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-xs font-mono text-gray-500">{menu.menu_code}</span>
                <span className="text-sm font-medium text-gray-900">{menu.menu_name}</span>
                {menu.menu_url && (
                    <span className="text-xs text-gray-400">→ {menu.menu_url}</span>
                )}
                {menu.children?.length > 0 && (
                    <span className="ml-auto text-xs text-gray-400">
                        ({menu.children.length})
                    </span>
                )}
            </div>

            {isExpanded &&
                menu.children?.map((child: any) => (
                    <MenuTreeItem key={child.menu_code} menu={child} level={level + 1} />
                ))}
        </div>
    );
};
