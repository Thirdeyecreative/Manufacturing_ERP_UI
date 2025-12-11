import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProductionBatchForm } from "@/components/production/ProductionBatchForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Factory,
  Calendar,
  Package,
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Edit,
  ToggleRight,
  ToggleLeft,
  QrCode,
} from "lucide-react";
import { BASE_URL } from "@/hooks/baseUrls";
import axios from "axios";
import QRCode from "qrcode";
import { useLocation } from "react-router-dom";

/**
 * Add a new production batch
 */
export async function addProductionBatch(data: {
  productId: string;
  quantity: string;
  clientId: string;
  expectedCompletionDate: string;
  productionHeadEmployeeId: string;
  productionNotes: string;
  stages: string[];
  floor: number;
  token: string;
  stageCategoryId?: string; // Add this
  manualProduct?: {
    productName: string;
    rawMaterials: Array<{
      material_name: string;
      quantity: number;
      unit: string;
      rawMaterialId: string;
    }>;
  };
}) {
  console.log(data);
  const formData = new FormData();

  if (data.productId) {
    formData.append("productId", data.productId);
  } else if (data.manualProduct) {
    const transformedRawMaterials = data.manualProduct.rawMaterials.map(
      (material) => ({
        raw_material_id: parseInt(material.rawMaterialId),
        quantity: material.quantity,
        unit: material.unit,
      })
    );

    console.log("Manual product payload:", transformedRawMaterials);
    formData.append(
      "rawMaterialsJsonStr",
      JSON.stringify(transformedRawMaterials)
    );
  } else {
    formData.append("productId", "");
  }

  formData.append("quantity", data.quantity);
  formData.append("clientId", data.clientId);
  formData.append("expectedCompletionDate", data.expectedCompletionDate);
  formData.append("productionHeadEmployeeId", data.productionHeadEmployeeId);
  formData.append("productionNotes", data.productionNotes);
  formData.append("token", data.token);
  formData.append("floor", data.floor.toString());

  // Handle stages vs stageCategoryId
  if (data.stageCategoryId && data.stageCategoryId !== "manual") {
    // User selected a category
    formData.append("stageCategoryId", data.stageCategoryId);
  } else if (data.stages && data.stages.length > 0) {
    // User selected manual stages
    formData.append("stages", JSON.stringify(data.stages));
  }

  console.log(Object.fromEntries(formData));

  const response = await axios.post(
    `${BASE_URL}/production-batches/add`,
    formData
  );
  console.log(response.data);
  return response.data;
}

/**
 * Update an existing production batch
 */
export async function updateProductionBatch(data: {
  batchId: string;
  productId: string;
  quantity: string;
  clientId: string;
  expectedCompletionDate: string;
  productionHeadEmployeeId: string;
  productionNotes: string;
  stages: string[];
  token: string;
  floor: number;
  batchStatus: string;
}) {
  const formData = new FormData();
  formData.append("batchId", data.batchId);
  formData.append("productId", data.productId);
  formData.append("quantity", data.quantity);
  formData.append("clientId", data.clientId);
  formData.append("stages", JSON.stringify(data.stages));
  formData.append("floor", data.floor.toString());
  if (
    typeof data.expectedCompletionDate === "object" &&
    data.expectedCompletionDate !== null &&
    (data.expectedCompletionDate as object) instanceof Date
  ) {
    formData.append(
      "expectedCompletionDate",
      (data.expectedCompletionDate as Date).toISOString()
    );
  } else {
    // If it's a string (e.g., "2025-10-07"), convert to a Date first
    const dateValue = new Date(data.expectedCompletionDate);
    formData.append("expectedCompletionDate", dateValue.toISOString());
  }
  formData.append("productionHeadEmployeeId", data.productionHeadEmployeeId);
  formData.append("productionNotes", data.productionNotes);
  formData.append("token", data.token);
  formData.append("batchStatus", data.batchStatus);

  const response = await axios.post(
    `${BASE_URL}/production-batches/update`,
    formData
  );
  return response.data;
}

/**
 * Get all production batches
 */
export async function getAllProductionBatches(token: string) {
  const response = await axios.get(
    `${BASE_URL}/production-batches/get-all/${token}`
  );
  console.log(response.data);
  return response.data;
}

/**
 * Get production batch details
 */
export async function getProductionBatchDetails(
  batchId: string,
  token: string
) {
  const response = await axios.get(
    `${BASE_URL}/production-batches/get-details/${batchId}/${token}`
  );
  return response.data;
}

/**
 * Change status of a production batch
 */
export async function changeProductionBatchStatus(
  batchId: string,
  status: string,
  token: string
) {
  const response = await axios.get(
    `${BASE_URL}/production-batches/change-status/${batchId}/${status}/${token}`
  );
  return response.data;
}

const Production = () => {
  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [productionData, setProductionData] = useState([]);
  const token = localStorage.getItem("token");
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [creticalOrders, setCriticalOrders] = useState([]);
  const [prefillData, setPrefillData] = useState<any | null>(null);
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const location = useLocation();

  const filterData = productionData?.filter((item) =>
    item.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // remove all completed
  const filterEdProductionStatus = productionData?.filter(
    (item) => item.batch_status != "completed"
  );

  console.log(filterEdProductionStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Factory className="h-4 w-4 text-blue-600" />;
      case "on_hold":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "on_hold":
        return "destructive";
      default:
        return "outline";
    }
  };

  const fetchallProductionData = async () => {
    try {
      const response = await getAllProductionBatches(token);
      console.log(response);

      if (response.errFlag !== 0) {
        console.log("problem getting from get all production batch");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Critical orders: expected date is today or passed AND status is not completed
      const criticalOrders = response.filter((order) => {
        const expectedDate = new Date(order.expected_completion_date);
        expectedDate.setHours(0, 0, 0, 0);
        return expectedDate <= today && order.batch_status !== "completed";
      });

      setCriticalOrders(criticalOrders);
      setProductionData(response);
    } catch (error) {
      console.error("Error fetching production data:", error);
    }
  };

  useEffect(() => {
    fetchallProductionData();
  }, []);

  async function fetchOrderDetails(id: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/orders/get-details/${id}/${token}`
      );
      const result = await response.json();
      console.log("Fetched Order Data for id ", id, ":", result);

      if (result.errFlag === 0 && result.data) {
        // 1. Set the prefill data
        setPrefillData(result.data);
        // 2. Open the form dialog
        setCreateBatchOpen(true);
        setMode("add"); // Ensure it's in ADD mode when prefilling from an Order
        setSelectedOrder(null);
      } else {
        console.error("Failed to fetch order details:", result.message);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  }

  useEffect(() => {
    const orderIdFromState = (location.state as any)?.orderId;
    if (orderIdFromState) {
      console.log("Navigated to Production with orderId:", orderIdFromState);
      fetchOrderDetails(orderIdFromState);
    }
  }, [location]);

  const handleStatusChange = async (batchId, status) => {
    console.log(status);

    const newStatus = status == 1 ? 0 : 1;
    console.log(newStatus);

    const res = await changeProductionBatchStatus(
      batchId,
      newStatus.toString(),
      token
    );
    fetchallProductionData();
  };

  const formateDate = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
  };

  const handleDownloadQrCode = async (order) => {
    const qrCodeString = `Order ID: ${order.id}
Production Code: ${order.production_code}
Product Name: ${order.product_name}
Status: ${order.batch_status}`;

    console.log("Data being encoded into QR Code:\n", qrCodeString);

    try {
      const imageUrl = await QRCode.toDataURL(qrCodeString, {
        width: 300,
        margin: 2,
      });

      const link = document.createElement("a");
      link.href = imageUrl;

      link.download = `qr-code-${order.production_code}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
      case "Critical":
        return "text-red-600";
      case "Medium":
        return "text-orange-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  //calculate stats
  const calculateStats = () => {
    if (!productionData || productionData.length === 0) {
      return {
        criticalOrders: 0,
        completedToday: 0,
        productionHeads: 0,
        unitsToday: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Critical Orders: orders where expected date is today or passed AND status is not completed
    const criticalOrders = productionData.filter((order) => {
      const expectedDate = new Date(order.expected_completion_date);
      expectedDate.setHours(0, 0, 0, 0);
      return expectedDate <= today && order.batch_status !== "completed";
    }).length;

    // Completed Today: orders completed today
    const completedToday = productionData.filter((order) => {
      if (order.batch_status !== "completed") return false;

      // If you have a completed_at field, use that, otherwise use updated_at
      const completedDate = new Date(order.updated_at || order.created_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    // Production Heads: count unique production heads
    const uniqueHeads = new Set(
      productionData
        .map((order) => order.production_head_employee_id)
        .filter(Boolean) // remove null/undefined
    ).size;

    // Units Today: sum of completed quantities for orders completed today
    const unitsToday = productionData
      .filter((order) => {
        if (order.batch_status !== "completed") return false;
        const completedDate = new Date(order.updated_at || order.created_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      })
      .reduce((sum, order) => sum + parseFloat(order.completed_qty || 0), 0);

    return {
      criticalOrders,
      completedToday,
      productionHeads: uniqueHeads,
      unitsToday: Math.round(unitsToday), // Round to whole number
    };
  };

  const stats = calculateStats();

  console.log(stats);

  // {
  //   criticalOrders: 5,
  //   completedToday: 0,
  //   productionHeads: 4,
  //   unitsToday: 0
  // }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Production Management
            </h1>
            <p className="text-muted-foreground">
              Manage production batches, stages, and critical orders with
              accountability
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateBatchOpen(true);
              setMode("add");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Production Batch
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical Orders
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.criticalOrders}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Today
              </CardTitle>
              <Package className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.completedToday}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Production Heads
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productionHeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Units Today
              </CardTitle>
              <Factory className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unitsToday}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Critical Orders Alert Banner */}
          {stats.criticalOrders > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800">
                      {stats.criticalOrders} Critical Orders Need Attention
                    </h3>
                    <p className="text-red-600 text-sm">
                      Orders with past due dates requiring immediate action
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMaterialDialogOpen(true)}
                >
                  View All Critical
                </Button>
              </div>
            </div>
          )}

          {/* Main Production Interface */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              {/* <TabsTrigger value="overview">Production Overview</TabsTrigger> */}
              <TabsTrigger value="stages">Active Stages</TabsTrigger>
              <TabsTrigger value="orders">All Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="stages" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {productionData.map((batch) => (
                  <Card key={batch.id + batch.client_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <span>{batch.production_code}</span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {batch.product_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-3">
                            <Progress
                              value={
                                (batch.completed_qty / batch.planned_qty) * 100
                              }
                              className="w-20 h-2"
                            />
                            <span className="text-sm font-medium">
                              {Math.round(
                                (batch.completed_qty / batch.planned_qty) * 100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {batch.stages.map((stage, index) => (
                          <div
                            key={stage.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                              {index + 1}
                            </div>
                            {getStatusIcon(stage.stage_status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {stage.stage_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stage.stage_head_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={getStatusColor(stage.stage_status)}
                                className="text-xs"
                              >
                                {stage.stage_status === "in_progress"
                                  ? "Active"
                                  : stage.status === "completed"
                                    ? "Done"
                                    : stage.status === "on_hold"
                                      ? "Hold"
                                      : "Pending"}
                              </Badge>
                              {stage.stage_status === "in_progress" && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {stage.progress_percentage}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Production Orders</CardTitle>
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Timeline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterData.map((order) => (
                        <TableRow
                          key={order.production_code}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            {order.production_code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {order.product_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.quantity} units
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{order.floor}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Progress
                                value={
                                  (order.completed_qty / order.planned_qty) *
                                  100
                                }
                                className="w-20 h-2"
                              />
                              <span className="text-sm font-medium">
                                {Math.round(
                                  (order.completed_qty / order.planned_qty) *
                                  100
                                )}
                                %
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formateDate(order.created_at)}</div>
                              <div className="text-muted-foreground">
                                to {formateDate(order.expected_completion_date)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.batch_status == "completed"
                                  ? "default"
                                  : order.batch_status == "inprogress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {order.batch_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order);
                                setCreateBatchOpen(true);
                                setMode("edit");
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadQrCode(order)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>

                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newStatus = order.status == 1 ? 0 : 1;
                                handleStatusChange(order.id, newStatus);
                              }}
                            >
                              {order.status == 1 ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button> */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog
          open={isAddMaterialDialogOpen}
          onOpenChange={setIsAddMaterialDialogOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Production Orders */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-destructive" />
                    Critical Production Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creticalOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No critical orders found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {creticalOrders?.map((order, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {order.production_code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span className="text-muted-foreground">
                                Due:{" "}
                                {new Date(
                                  order.expected_completion_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium">
                              {order.product_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {order.client_name}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-medium">Progress:</span>{" "}
                                {order.completed_qty}/{order.planned_qty}
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              {order.completed_qty / order.planned_qty}%
                              Complete
                            </div>
                          </div>

                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 bg-red-500 ${order.delayRisk === "Critical" && "bg-red-500"
                                }`}
                              style={{
                                width: `${order.completed_qty / order.planned_qty
                                  }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        <ProductionBatchForm
          token={token}
          baseUrl={BASE_URL}
          mode={mode}
          open={createBatchOpen}
          onOpenChange={setCreateBatchOpen}
          onSuccess={fetchallProductionData}
          batchData={selectedOrder}
          prefillOrderData={prefillData}
        />
      </div>
    </MainLayout>
  );
};

export default Production;
