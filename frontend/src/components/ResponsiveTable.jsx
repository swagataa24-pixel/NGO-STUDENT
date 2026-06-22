export function ResponsiveTable({ headers, rows, ariaLabel = 'Responsive data table' }) {
  return (
    <div className="responsive-table" role="region" aria-label={ariaLabel} tabIndex={0}>
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={String(header)}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td data-label={headers[cellIndex]} key={`cell-${rowIndex}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
