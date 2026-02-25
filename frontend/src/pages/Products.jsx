import {
    Table,
    Typography,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Space,
    Popconfirm,
    message,
    Select // 1. Import thêm Select từ antd
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";

const { Title } = Typography;
const API_PRODUCTS = "http://localhost:5000/api/products";
const API_CATEGORIES = "http://localhost:5000/api/categories"; // 2. Đường dẫn API lấy danh mục

const Products = () => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]); // State lưu danh sách danh mục
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();

    // Lấy danh sách sản phẩm
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_PRODUCTS);
            setData(res.data);
        } catch {
            message.error("Lỗi tải sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách danh mục
    const fetchCategories = async () => {
        try {
            const res = await axios.get(API_CATEGORIES);
            setCategories(res.data);
        } catch {
            message.error("Lỗi tải danh mục");
        }
    };

    // Gọi API khi vừa mở trang
    useEffect(() => {
        fetchProducts();
        fetchCategories(); 
    }, []);

    const openAdd = () => {
        setEditing(null);
        form.resetFields();
        setOpen(true);
    };

    const openEdit = (record) => {
        setEditing(record);
        form.setFieldsValue(record);
        setOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_PRODUCTS}/${id}`);
            message.success("Đã xoá");
            fetchProducts();
        } catch (error) {
            message.error("Lỗi khi xoá sản phẩm");
        }
    };

    const handleSubmit = async () => {
        try {
            // Validate dữ liệu form trước
            const values = await form.validateFields();

            if (editing) {
                await axios.put(`${API_PRODUCTS}/${editing.product_id}`, values);
                message.success("Cập nhật thành công");
            } else {
                await axios.post(API_PRODUCTS, values);
                message.success("Thêm sản phẩm thành công");
            }

            setOpen(false);
            fetchProducts();
        } catch (error) {
            // Bắt lỗi nếu API trả về lỗi hoặc người dùng chưa nhập đủ form
            if (error.response) {
                message.error("Lỗi: " + error.response.data.error);
            }
        }
    };

    const columns = [
        { title: "ID", dataIndex: "product_id", width: 70 },
        { title: "Tên sản phẩm", dataIndex: "product_name" },
        {
            title: "Giá",
            dataIndex: "price",
            render: (v) => `${Number(v).toLocaleString()} ₫`,
        },
        { title: "Tồn kho", dataIndex: "stock" },
        {
            title: "Hành động",
            render: (_, r) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(r)}>Sửa</Button>
                    <Popconfirm
                        title="Xoá sản phẩm này?"
                        onConfirm={() => handleDelete(r.product_id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="link" danger>Xoá</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Title level={3}>Quản lý sản phẩm</Title>

            <Button type="primary" onClick={openAdd} style={{ marginBottom: 16 }}>
                + Thêm sản phẩm
            </Button>

            <Table
                rowKey="product_id"
                columns={columns}
                dataSource={data}
                loading={loading}
            />

            <Modal
                title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                open={open}
                onOk={handleSubmit}
                onCancel={() => setOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="product_name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Nhập tên sản phẩm..." />
                    </Form.Item>

                    <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}>
                        <InputNumber style={{ width: "100%" }} placeholder="Ví dụ: 2500000" />
                    </Form.Item>

                    <Form.Item name="stock" label="Số lượng tồn kho" rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}>
                        <InputNumber style={{ width: "100%" }} placeholder="Ví dụ: 10" />
                    </Form.Item>

                    {/* 3. Đã đổi từ InputNumber sang Select Dropdown */}
                    <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
                        <Select placeholder="-- Chọn một danh mục --">
                            {categories.map((cat) => (
                                <Select.Option key={cat.category_id} value={cat.category_id}>
                                    {cat.category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="image_url" label="Link Ảnh (URL)">
                        <Input placeholder="https://..." />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default Products;