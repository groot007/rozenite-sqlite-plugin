import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import * as SQLite from "expo-sqlite";
import { useRozeniteSQLite } from "rozenite-sqlite/react-native";
import { DB_CONFIG } from "@/constants/dbConfig";
import {
  initializeDatabases,
  loadTableData,
  saveRow,
  deleteRow,
} from "@/utils/database";

export default function HomeScreen() {
  const [selectedDB, setSelectedDB] = useState<"users" | "products" | "notes" | "analytics">(
    "users"
  );
  const [selectedTable, setSelectedTable] = useState<string>("users");
  const [rows, setRows] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [databases, setDatabases] = useState<Record<string, SQLite.SQLiteDatabase>>({});

  // Connect to the Rozenite SQLite devtools panel.
  // The hook handles all messaging — databases list + SQL execution.
  useRozeniteSQLite({
    databases: Object.keys(databases).map((k) => `${k}.db`),
    sqlExecutor: async (dbName, query) => {
      const key = dbName.replace(/\.db$/, "");
      const db = databases[key];
      if (!db) throw new Error(`Database "${dbName}" not found`);
      return db.getAllAsync(query) as Promise<Record<string, unknown>[]>;
    },
  });

  useEffect(() => {
    const setup = async () => {
      const dbs = await initializeDatabases();
      setDatabases(dbs);
    };
    setup();
  }, []);

  useEffect(() => {
    const load = async () => {
      const db = databases[selectedDB];
      if (!db) return;
      const data = await loadTableData(db, selectedTable);
      setRows(data);
    };
    load();
  }, [selectedDB, selectedTable, databases]);

  const getTableConfig = (): { name: string; columns: string[]; createSQL: string } => {
    return (DB_CONFIG[selectedDB as keyof typeof DB_CONFIG].tables as any)[selectedTable];
  };

  const handleAddEdit = async () => {
    const db = databases[selectedDB];
    if (!db) return;

    const config = getTableConfig();
    const columns = config.columns.filter((col) => col !== "id");

    try {
      await saveRow(db, selectedTable, columns, formData, editingId);
      setFormData({});
      setEditingId(null);
      setModalVisible(false);
      const data = await loadTableData(db, selectedTable);
      setRows(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to save data: ${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          const db = databases[selectedDB];
          if (!db) return;

          try {
            await deleteRow(db, selectedTable, id);
            const data = await loadTableData(db, selectedTable);
            setRows(data);
          } catch (error) {
            Alert.alert("Error", `Failed to delete: ${error}`);
          }
        },
      },
    ]);
  };

  const handleEdit = (row: any) => {
    const config = getTableConfig();
    const data: Record<string, string> = {};
    config.columns.forEach((col) => {
      if (col !== "id") {
        data[col] = String(row[col] || "");
      }
    });
    setFormData(data);
    setEditingId(row.id);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setFormData({});
    setEditingId(null);
    setModalVisible(true);
  };

  const config = getTableConfig();
  const inputColumns = config.columns.filter((col) => col !== "id");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Manager</Text>

      {/* Database Selector */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Select Database</Text>
        <View style={styles.buttonGroup}>
          {(["users", "products", "notes", "analytics"] as const).map((db) => (
            <TouchableOpacity
              key={db}
              style={[
                styles.dbButton,
                selectedDB === db && styles.dbButtonActive,
              ]}
              onPress={() => {
                setSelectedDB(db);
                setSelectedTable(Object.keys(DB_CONFIG[db].tables)[0]);
              }}
            >
              <Text
                style={[
                  styles.dbButtonText,
                  selectedDB === db && styles.dbButtonTextActive,
                ]}
              >
                {db.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table Selector */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Select Table</Text>
        <View style={styles.buttonGroup}>
          {Object.keys(DB_CONFIG[selectedDB].tables).map((table) => (
            <TouchableOpacity
              key={table}
              style={[
                styles.tableButton,
                selectedTable === table && styles.tableButtonActive,
              ]}
              onPress={() => setSelectedTable(table)}
            >
              <Text
                style={[
                  styles.tableButtonText,
                  selectedTable === table && styles.tableButtonTextActive,
                ]}
              >
                {table}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Button */}
      <Button
        title="+ Add New Row"
        onPress={openAddModal}
        color="#4CAF50"
      />

      {/* Data List */}
      <ScrollView style={{ marginTop: 16 }}>
        <FlatList
          scrollEnabled={false}
          data={rows}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.rowContainer}>
              <View style={{ flex: 1 }}>
                {inputColumns.map((col) => (
                  <Text key={col} style={styles.rowText}>
                    <Text style={styles.columnLabel}>{col}:</Text> {item[col]}
                  </Text>
                ))}
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  style={styles.editButton}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No data in this table</Text>
          }
        />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit" : "Add New"} Row
            </Text>

            {inputColumns.map((col) => (
              <View key={col} style={styles.formGroup}>
                <Text style={styles.formLabel}>{col}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={`Enter ${col}`}
                  value={formData[col] || ""}
                  onChangeText={(text) =>
                    setFormData({ ...formData, [col]: text })
                  }
                  placeholderTextColor="#999"
                />
              </View>
            ))}

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button
                title={editingId ? "Update" : "Add"}
                onPress={handleAddEdit}
                color="#4CAF50"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#444",
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dbButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ddd",
    borderWidth: 1,
    borderColor: "#999",
  },
  dbButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  dbButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dbButtonTextActive: {
    color: "#fff",
  },
  tableButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#bbb",
  },
  tableButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
  },
  tableButtonText: {
    fontSize: 13,
    color: "#333",
  },
  tableButtonTextActive: {
    color: "#fff",
  },
  rowContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    elevation: 2,
  },
  rowText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  columnLabel: {
    fontWeight: "600",
    color: "#333",
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 24,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});