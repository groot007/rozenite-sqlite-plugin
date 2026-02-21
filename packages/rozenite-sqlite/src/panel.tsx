import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { C } from './theme';
import { useExplorerState } from './hooks/useExplorerState';
import { Toolbar } from './components/Toolbar';
import { SqlPanel } from './components/SqlPanel';
import { DataTable } from './components/DataTable';
import { RowDetailPanel } from './components/RowDetailPanel';

export default function SQLiteExplorerPanel() {
  const { state, selectDB, selectTable, selectRow, closeRow, saveRow, deleteRow, refresh, clearTable, runCustomQuery } = useExplorerState();
  const { databases, selectedDB, tables, selectedTable, rows, columns, selectedRowIndex, status, error } = state;

  const isLoadingTables = status === 'loadingTables';
  const isLoadingData = status === 'loadingData';
  const selectedRow = selectedRowIndex !== null ? rows[selectedRowIndex] ?? null : null;

  const [sqlOpen, setSqlOpen] = useState(false);

  return (
    <View style={s.root}>
      <Toolbar
        databases={databases}
        selectedDB={selectedDB}
        tables={tables}
        selectedTable={selectedTable}
        loadingTables={isLoadingTables}
        loadingData={isLoadingData}
        rowCount={rows.length}
        columnCount={columns.length}
        onSelectDB={selectDB}
        onSelectTable={selectTable}
        onRefresh={refresh}
        sqlOpen={sqlOpen}
        onToggleSql={() => setSqlOpen((v) => !v)}
      />

      {sqlOpen && selectedDB && (
        <SqlPanel selectedDB={selectedDB} runCustomQuery={runCustomQuery} />
      )}

      <View style={s.content}>
        <DataTable
          columns={columns}
          rows={rows}
          selectedRowIndex={selectedRowIndex}
          onRowSelect={selectRow}
          status={status}
          error={error}
          onClearTable={selectedTable ? clearTable : undefined}
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

