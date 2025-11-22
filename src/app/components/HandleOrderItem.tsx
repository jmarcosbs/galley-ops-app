import { useOrderContext } from '../../context/OrderContext';
import CommentOrder from './CommentOrder';
import DeleteOrder from './DeleteOrder';

interface HandleOrderItemProps {
    dishIndex: number;
}

export default function HandleOrderItem({ dishIndex }: HandleOrderItemProps) {
    const { dishes } = useOrderContext();
    const dishUniqueId = dishes[dishIndex].unique_id;

    return (
        <div className='flex items-center flex-col'>
            <CommentOrder dishUniqueId={dishUniqueId} />
            <DeleteOrder dishIndex={dishIndex} />
        </div>
    );
}