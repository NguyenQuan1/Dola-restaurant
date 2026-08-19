export declare class CreateTableDto {
    code: string;
    floor: number;
    capacity: number;
    shape?: 'rect' | 'circle';
    x?: number;
    y?: number;
    col?: number;
    row?: number;
    colSpan?: number;
    status?: 'available' | 'reserved' | 'occupied';
}
