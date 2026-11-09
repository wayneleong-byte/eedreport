import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { MotionConfig, Reorder, useDragControls } from "framer-motion";
import type { ItemView, Section } from "@shared/schema";
import { itemsForSection, type ReportData } from "@/lib/report";
import { currentPointerY } from "@/lib/reorder";
import { useSortableOrder } from "@/lib/use-sortable-order";
import { ReportCard } from "@/components/ReportCard";
import { DragHandle } from "@/components/DragHandle";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY_ITEMS: ItemView[] = [];
const NUDGE_PX = 56;

function nudgeSlots(startY: number | null, lastY: number | null) {
  if (startY == null || lastY == null) return 0;
  const delta = lastY - startY;
  if (Math.abs(delta) < NUDGE_PX) return 0;
  return delta > 0 ? Math.floor(delta / NUDGE_PX) : Math.ceil(delta / NUDGE_PX);
}

export function ReportBoard({
  data,
  isEditor,
  onOpen,
  onEdit,
  onAdd,
}: {
  data: ReportData;
  isEditor: boolean;
  onOpen: (item: ItemView) => void;
  onEdit: (item: ItemView) => void;
  onAdd: (sectionId: number) => void;
}) {
  if (!isEditor) {
    return (
      <div className="space-y-[42px]">
        {data.sections.map((section) => {
          const items = itemsForSection(data, section.id);
          return (
            <section
              key={section.id}
              id={section.anchor || `section-${section.id}`}
              data-testid={`section-${section.id}`}
              className="scroll-mt-24"
            >
              <SectionHeader
                section={section}
                count={items.length}
                isEditor={false}
                onAdd={() => onAdd(section.id)}
              />
              <ItemStack items={items} onOpen={onOpen} onEdit={onEdit} />
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <EditableBoard data={data} onOpen={onOpen} onEdit={onEdit} onAdd={onAdd} />
    </MotionConfig>
  );
}

function EditableBoard({
  data,
  onOpen,
  onEdit,
  onAdd,
}: {
  data: ReportData;
  onOpen: (item: ItemView) => void;
  onEdit: (item: ItemView) => void;
  onAdd: (sectionId: number) => void;
}) {
  const sections = useSortableOrder(data.sections, "sections", "已調整區段順序");
  const itemsBySection = useMemo(() => {
    const map = new Map<number, ItemView[]>();
    for (const section of data.sections) {
      map.set(section.id, itemsForSection(data, section.id));
    }
    return map;
  }, [data]);

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={sections.local}
      onReorder={sections.onReorder}
      className="eed-reorder-group flex flex-col gap-[42px]"
      data-testid="reorder-sections"
    >
      {sections.local.map((section, index) => (
        <SortableSection
          key={section.id}
          section={section}
          index={index}
          items={itemsBySection.get(section.id) ?? EMPTY_ITEMS}
          onSectionDragStart={sections.onDragStart}
          onSectionDragEnd={sections.onDragEnd}
          onSectionMove={sections.moveBy}
          onOpen={onOpen}
          onEdit={onEdit}
          onAdd={onAdd}
        />
      ))}
    </Reorder.Group>
  );
}

function SortableSection({
  section,
  index,
  items,
  onSectionDragStart,
  onSectionDragEnd,
  onSectionMove,
  onOpen,
  onEdit,
  onAdd,
}: {
  section: Section;
  index: number;
  items: ItemView[];
  onSectionDragStart: () => void;
  onSectionDragEnd: (index: number, nudge?: number) => void;
  onSectionMove: (index: number, dir: -1 | 1) => void;
  onOpen: (item: ItemView) => void;
  onEdit: (item: ItemView) => void;
  onAdd: (sectionId: number) => void;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  return (
    <Reorder.Item
      as="section"
      value={section}
      id={section.anchor || `section-${section.id}`}
      data-testid={`section-${section.id}`}
      className={cn("eed-reorder-item scroll-mt-24", dragging && "is-dragging")}
      dragListener={false}
      dragControls={controls}
      layout="position"
      onDragStart={() => {
        if (startY.current == null) startY.current = currentPointerY();
        setDragging(true);
        onSectionDragStart();
      }}
      onDragEnd={() => {
        setDragging(false);
        onSectionDragEnd(index, nudgeSlots(startY.current, currentPointerY()));
        startY.current = null;
      }}
    >
      <SectionHeader
        section={section}
        count={items.length}
        isEditor
        onAdd={() => onAdd(section.id)}
        handle={
          <DragHandle
            testId={`button-drag-section-${section.id}`}
            label={`拖曳調整區段順序 ${section.title}`}
            className="compact"
            onPointerDown={(event) => {
              startY.current = event.clientY;
              controls.start(event);
            }}
            onMove={(dir) => onSectionMove(index, dir)}
          />
        }
      />
      <SortableItems items={items} sectionId={section.id} onOpen={onOpen} onEdit={onEdit} />
    </Reorder.Item>
  );
}

function SortableItems({
  items,
  sectionId,
  onOpen,
  onEdit,
}: {
  items: ItemView[];
  sectionId: number;
  onOpen: (item: ItemView) => void;
  onEdit: (item: ItemView) => void;
}) {
  const order = useSortableOrder(items, "items", "已調整項目順序");

  if (items.length === 0) {
    return <EmptySection />;
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={order.local}
      onReorder={order.onReorder}
      className="eed-reorder-group flex flex-col gap-[18px]"
      data-testid={`reorder-items-${sectionId}`}
    >
      {order.local.map((item, index) => (
        <SortableCard
          key={item.id}
          item={item}
          index={index}
          onOpen={onOpen}
          onEdit={onEdit}
          onDragStart={order.onDragStart}
          onDragEnd={order.onDragEnd}
          onMove={order.moveBy}
        />
      ))}
    </Reorder.Group>
  );
}

function SortableCard({
  item,
  index,
  onOpen,
  onEdit,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  item: ItemView;
  index: number;
  onOpen: (item: ItemView) => void;
  onEdit: (item: ItemView) => void;
  onDragStart: () => void;
  onDragEnd: (index: number, nudge?: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const start = (event: ReactPointerEvent<HTMLButtonElement>) => {
    startY.current = event.clientY;
    controls.start(event);
  };

  return (
    <Reorder.Item
      as="div"
      value={item}
      className={cn("eed-reorder-item", dragging && "is-dragging")}
      dragListener={false}
      dragControls={controls}
      layout="position"
      onDragStart={() => {
        if (startY.current == null) startY.current = currentPointerY();
        setDragging(true);
        onDragStart();
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd(index, nudgeSlots(startY.current, currentPointerY()));
        startY.current = null;
      }}
      data-testid={`reorder-item-${item.id}`}
    >
      <ReportCard
        item={item}
        index={index}
        onOpen={() => onOpen(item)}
        onEdit={() => onEdit(item)}
        accessory={
          <DragHandle
            testId={`button-drag-item-${item.id}`}
            label={`拖曳調整項目順序 ${item.title}`}
            onPointerDown={start}
            onMove={(dir) => onMove(index, dir)}
          />
        }
      />
    </Reorder.Item>
  );
}

function ItemStack({
  items,
  onOpen,
  onEdit,
}: {
  items: ItemView[];
  onOpen: (item: ItemView) => void;
  onEdit: (item: ItemView) => void;
}) {
  if (items.length === 0) return <EmptySection />;
  return (
    <div className="flex flex-col gap-[18px]">
      {items.map((item, index) => (
        <ReportCard
          key={item.id}
          item={item}
          index={index}
          onOpen={() => onOpen(item)}
          onEdit={() => onEdit(item)}
        />
      ))}
    </div>
  );
}

function EmptySection() {
  return (
    <p className="border border-dashed border-primary/30 px-6 py-9 text-center text-[24px] text-muted-foreground">
      此區段尚無項目。
    </p>
  );
}

function SectionHeader({
  section,
  count,
  isEditor,
  onAdd,
  handle,
}: {
  section: Section;
  count: number;
  isEditor: boolean;
  onAdd: () => void;
  handle?: ReactNode;
}) {
  return (
    <div className="mb-[21px] flex flex-wrap items-center gap-x-[18px] gap-y-2 font-mono text-[21px] lg:flex-nowrap">
      {handle}
      {section.anchor && <span className="eed-sec-tag">{section.anchor}</span>}
      <h2
        data-testid={`text-section-title-${section.id}`}
        className="min-w-0 font-sans text-[30px] font-semibold tracking-normal"
      >
        {section.title}
      </h2>
      <div className="eed-section-rule h-px flex-1" />
      <span className="text-muted-foreground">{count} ENTRIES</span>
      {isEditor && (
        <button
          data-testid={`button-add-item-${section.id}`}
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-3 py-1.5 text-[18px] font-medium text-primary"
        >
          <Plus className="h-[18px] w-[18px]" /> 新增
        </button>
      )}
    </div>
  );
}
