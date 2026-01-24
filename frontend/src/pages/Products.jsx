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
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";

const { Title } = Typography;
const API = "http://localhost:5000/api/products";

const Products = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API);
            setData(res.data);
        } catch {
            message.error("Lỗi tải sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
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
        await axios.delete(`${API}/${id}`);
        message.success("Đã xoá");
        fetchProducts();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();

        if (editing) {
            await axios.put(`${API}/${editing.product_id}`, values);
            message.success("Cập nhật thành công");
        } else {
            await axios.post(API, values);
            message.success("Thêm sản phẩm thành công");
        }

        setOpen(false);
        fetchProducts();
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
                        title="Xoá sản phẩm?"
                        onConfirm={() => handleDelete(r.product_id)}
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
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="product_name" label="Tên sản phẩm" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]}>
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="category_id" label="Category ID" rules={[{ required: true }]}>
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="image_url" label="Ảnh (URL)">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default Products;