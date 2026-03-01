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
    Select,
    Image // Thêm Image để hiển thị ảnh trong bảng
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import { UploadOutlined } from '@ant-design/icons'; // Import icon upload

const { Title } = Typography;
const API_PRODUCTS = "http://localhost:5000/api/products";
const API_CATEGORIES = "http://localhost:5000/api/categories";

const Products = () => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    
    // State lưu file ảnh được chọn
    const [file, setFile] = useState(null);

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

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Hàm xử lý khi người dùng chọn file từ máy tính
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]); // Lưu file vào state
        }
    };

    const openAdd = () => {
        setEditing(null);
        setFile(null); // Reset file cũ
        form.resetFields();
        setOpen(true);
    };

    const openEdit = (record) => {
        setEditing(record);
        setFile(null); // Reset file cũ
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

    // --- PHẦN QUAN TRỌNG NHẤT: XỬ LÝ GỬI FORM DATA ---
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // 1. Tạo đối tượng FormData
            const formData = new FormData();

            // 2. Đưa các dữ liệu chữ vào FormData
            formData.append('product_name', values.product_name);
            formData.append('price', values.price);
            formData.append('stock', values.stock);
            formData.append('category_id', values.category_id);

            // 3. Nếu có chọn file mới thì đưa vào, không thì thôi
            if (file) {
                formData.append('image', file);
            }

            // 4. Gửi request
            if (editing) {
                // Lưu ý: Nếu backend chưa hỗ trợ PUT với FormData, bạn cần sửa backend thêm.
                // Tạm thời code này giả định backend API PUT cũng dùng multer giống POST
                await axios.put(`${API_PRODUCTS}/${editing.product_id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success("Cập nhật thành công");
            } else {
                await axios.post(API_PRODUCTS, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success("Thêm sản phẩm thành công");
            }

            setOpen(false);
            fetchProducts(); // Tải lại bảng
        } catch (error) {
            console.error(error);
            if (error.response) {
                message.error("Lỗi: " + error.response.data.error);
            } else {
                message.error("Có lỗi xảy ra");
            }
        }
    };

    const columns = [
        { title: "ID", dataIndex: "product_id", width: 50 },
        // Thêm cột hiển thị ảnh
        { 
            title: "Ảnh", 
            dataIndex: "image_url",
            render: (url) => (
                <Image 
                    width={50} 
                    src={url ? url : "https://via.placeholder.com/50"} 
                    alt="sp"
                    style={{ borderRadius: '5px', objectFit: 'cover' }}
                />
            )
        },
        { title: "Tên sản phẩm", dataIndex: "product_name" },
        {
            title: "Giá",
            dataIndex: "price",
            render: (v) => `${Number(v).toLocaleString()} ₫`,
        },
        { title: "Tồn kho", dataIndex: "stock", align: 'center' },
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

                    <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
                        <Select placeholder="-- Chọn một danh mục --">
                            {categories.map((cat) => (
                                <Select.Option key={cat.category_id} value={cat.category_id}>
                                    {cat.category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Thay đổi Input text thành Input File */}
                    <Form.Item label="Hình ảnh sản phẩm">
                        <Input type="file" onChange={handleFileChange} accept="image/*" />
                        {/* Nếu đang sửa, hiện ảnh cũ để người dùng nhớ */}
                        {editing && editing.image_url && !file && (
                            <div style={{ marginTop: 10, fontSize: 12, color: 'gray' }}>
                                Ảnh hiện tại: <a href={editing.image_url} target="_blank" rel="noreferrer">Xem ảnh</a>
                            </div>
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default Products;