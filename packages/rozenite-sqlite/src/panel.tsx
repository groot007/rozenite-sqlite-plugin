import React from 'react';
import { View, StyleSheet } from 'react-native';
import { C } from './theme';
import { useExplorerState } from './hooks/useExplorerState';
import { Toolbar } from './components/Toolbar';
import { DataTable } from './components/DataTable';
import { RowDetailPanel } from './components/RowDetailPanel';

export default function SQLiteExplorerPanel() {
  const { state, selectDB, selectTable, selectRow, closeRow, saveRow, deleteRow } = useExplorerState();
  const { databases, selectedDB, tables, selectedTable, rows, columns, selectedRowIndex, loadingTables, loadingData } = state;

  const selectedRow = selectedRowIndex !== null ? rows[selectedRowIndex] ?? null : null;

  return (
    <View style={s.root}>
      <Toolbar
        databases={databases}
        selectedDB={selectedDB}
        tables={tables}
        selectedTable={selectedTable}
        loadingTables={loadingTables}
        loadingData={loadingData}
        rowCount={rows.length}
        columnCount={columns.length}
        onSelectDB={selectDB}
        onSelectTable={selectTable}
      />

      <View style={s.content}>
        <DataTable
          columns={columns}
          rows={rows}
          selectedRowIndex={selectedRowIndex}
          onRowSelect={selectRow}
          loading={loadingData}
        />
        {selectedRow !== null && (
          <RowDetailPanel
            row={selectedRow}
            rowIndex={selectedRowIndex}
            onClose={closeRow}
            onSave={saveRow}
            onDelete={deleteRow}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, flexDirection: 'column' },
  content: { flex: 1, flexDirection: 'row', overflow: 'hidden' },
});

