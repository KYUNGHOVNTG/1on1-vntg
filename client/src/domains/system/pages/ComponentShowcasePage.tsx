import React, { useState } from 'react';
import {
    Button,
    Input,
    Card,
    Badge,
    Avatar,
    ProgressBar,
    Select,
    Textarea,
    Checkbox,
    Toggle,
    Breadcrumb,
    ConfirmModal
} from '@/core/ui';
import { toast } from 'sonner';


export const ComponentShowcasePage: React.FC = () => {
    // State for interactive elements
    const [inputValue, setInputValue] = useState('');
    const [textValue, setTextValue] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [isToggled, setIsToggled] = useState(false);
    const [selectValue, setSelectValue] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showToast = (type: 'success' | 'error' | 'info' | 'warning') => {
        switch (type) {
            case 'success': toast.success('성공 메시지입니다.'); break;
            case 'error': toast.error('오류 메시지입니다.'); break;
            case 'info': toast.info('정보 메시지입니다.'); break;
            case 'warning': toast.warning('경고 메시지입니다.'); break;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 -m-8 p-8 space-y-8 pb-20 animate-fade-in-up">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="mb-8">
                    <Breadcrumb
                        items={[
                            { label: '시스템 관리', href: '/system' },
                            { label: '공통컴포넌트' }
                        ]}
                        className="mb-4"
                    />
                    <h1 className="text-3xl font-bold text-gray-900">공통 UI 컴포넌트</h1>
                    <p className="text-gray-500 mt-2">
                        시스템 전체에서 사용되는 재사용 가능한 UI 컴포넌트 모음입니다.
                    </p>
                </div>

                {/* Typography & Colors */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Typography & Colors</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-6 space-y-2">
                            <h1 className="text-4xl font-bold">Heading 1</h1>
                            <h2 className="text-3xl font-bold">Heading 2</h2>
                            <h3 className="text-2xl font-bold">Heading 3</h3>
                            <h4 className="text-xl font-bold">Heading 4</h4>
                            <p className="text-base text-gray-600">Body Text (Base)</p>
                            <p className="text-sm text-gray-500">Caption Text (Small)</p>
                            <p className="text-xs text-gray-400">Tiny Text (Extra Small)</p>
                        </Card>
                        <Card className="p-6 grid grid-cols-2 gap-4">
                            <div className="bg-indigo-600 text-white p-4 rounded-lg text-center">Primary</div>
                            <div className="bg-gray-900 text-white p-4 rounded-lg text-center">Secondary</div>
                            <div className="bg-green-500 text-white p-4 rounded-lg text-center">Success</div>
                            <div className="bg-red-500 text-white p-4 rounded-lg text-center">Error</div>
                            <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">Warning</div>
                            <div className="bg-blue-500 text-white p-4 rounded-lg text-center">Info</div>
                        </Card>
                    </div>
                </section>

                {/* Buttons */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Buttons</h2>
                    <Card className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Variants</h3>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Sizes</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button size="sm">Small</Button>
                                <Button size="md">Medium</Button>
                                <Button size="lg">Large</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">States</h3>
                            <div className="flex flex-wrap gap-3">
                                <Button isLoading>Loading</Button>
                                <Button disabled>Disabled</Button>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Form Elements */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Form Elements</h2>
                    <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Input
                                label="Text Input"
                                placeholder="Type something..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <Input
                                label="Error State"
                                error="This field is required"
                                placeholder="Error..."
                            />
                            <Select
                                label="Select Option"
                                options={[
                                    { label: 'Option 1', value: '1' },
                                    { label: 'Option 2', value: '2' },
                                    { label: 'Option 3', value: '3' },
                                ]}
                                value={selectValue}
                                onChange={(val) => setSelectValue(val)}
                            />
                        </div>
                        <div className="space-y-4">
                            <Textarea
                                label="Textarea"
                                placeholder="Long text here..."
                                value={textValue}
                                onChange={(e) => setTextValue(e.target.value)}
                            />
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={isChecked}
                                        onChange={(e) => setIsChecked(e.target.checked)}
                                    />
                                    <span className="text-sm">Checkbox Option</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        disabled
                                    />
                                    <span className="text-sm text-gray-400">Disabled</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Toggle
                                        checked={isToggled}
                                        onChange={(e) => setIsToggled(e.target.checked)}
                                    />
                                    <span className="text-sm">Toggle Switch</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Toggle
                                        disabled
                                    />
                                    <span className="text-sm text-gray-400">Disabled</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Data Display */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Data Display</h2>
                    <Card className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Badges</h3>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="primary">Primary</Badge>
                                <Badge variant="success">Success</Badge>
                                <Badge variant="warning">Warning</Badge>
                                <Badge variant="error" >Error</Badge>
                                <Badge variant="neutral">Neutral</Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Avatars</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <Avatar src="https://i.pravatar.cc/150?img=1" alt="User 1" size="sm" />
                                <Avatar src="https://i.pravatar.cc/150?img=2" alt="User 2" size="md" />
                                <Avatar src="https://i.pravatar.cc/150?img=3" alt="User 3" size="lg" />
                                <Avatar initials="JD" size="md" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Progress Bar</h3>
                            <div className="space-y-3 max-w-md">
                                <ProgressBar value={30} label="Default" />
                                <ProgressBar value={70} label="Success" color="bg-emerald-500" />
                                <ProgressBar value={90} label="Error" color="bg-red-500" />
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Feedback & Overlay */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Feedback & Overlay</h2>
                    <Card className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Toast Notifications</h3>
                            <div className="flex flex-wrap gap-3">
                                <Button onClick={() => showToast('success')} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">Success Toast</Button>
                                <Button onClick={() => showToast('error')} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Error Toast</Button>
                                <Button onClick={() => showToast('info')} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">Info Toast</Button>
                                <Button onClick={() => showToast('warning')} variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">Warning Toast</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Modals</h3>
                            <div>
                                <Button onClick={() => setIsModalOpen(true)} variant="primary">Open Confirm Modal</Button>

                                <ConfirmModal
                                    isOpen={isModalOpen}
                                    onClose={() => setIsModalOpen(false)}
                                    onConfirm={() => {
                                        toast.success('Confirmed!');
                                        setIsModalOpen(false);
                                    }}
                                    title="Example Modal"
                                    message="This is a demonstration of the confirmation modal component. It uses a portal to render at the document root."
                                    confirmText="Confirm Action"
                                />
                            </div>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    );
};
