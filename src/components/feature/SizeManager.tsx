import { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/currency';
import { useItemSizes } from '../../hooks/useItemSizes';
import Button from '../base/Button';
import Input from '../base/Input';

interface Size {
  id?: string;
  name: string;
  description: string;
  price: number;
  is_default: boolean;
}

interface SizeManagerProps {
  foodItemId: string;
  onClose: () => void;
}

export default function SizeManager({ foodItemId, onClose }: SizeManagerProps) {
  const { sizes, isLoading, addSize, updateSize, deleteSize } = useItemSizes(foodItemId);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [newSize, setNewSize] = useState<Size>({
    name: '',
    description: '',
    price: 0,
    is_default: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.type === 'number'
      ? parseFloat(e.target.value)
      : e.target.value;

    if (editingSize) {
      setEditingSize({ ...editingSize, [e.target.name]: value });
    } else {
      setNewSize({ ...newSize, [e.target.name]: value });
    }
  };

  const handleAddSize = async () => {
    try {
      await addSize({
        food_item_id: foodItemId,
        name: newSize.name,
        description: newSize.description,
        price: newSize.price,
        is_default: newSize.is_default
      });
      setNewSize({
        name: '',
        description: '',
        price: 0,
        is_default: false
      });
    } catch (error) {
      console.error('Error adding size:', error);
      alert('Failed to add size. Please try again.');
    }
  };

  const handleUpdateSize = async () => {
    if (!editingSize?.id) return;

    try {
      await updateSize(editingSize.id, {
        name: editingSize.name,
        description: editingSize.description,
        price: editingSize.price,
        is_default: editingSize.is_default
      });
      setEditingSize(null);
    } catch (error) {
      console.error('Error updating size:', error);
      alert('Failed to update size. Please try again.');
    }
  };

  const handleDeleteSize = async (id: string) => {
    if (!confirm('Are you sure you want to delete this size?')) return;

    try {
      await deleteSize(id);
    } catch (error) {
      console.error('Error deleting size:', error);
      alert('Failed to delete size. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Size Options</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Size List */}
      <div className="space-y-4">
        {sizes.map((size) => (
          <div key={size.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{size.name}</h4>
                <p className="text-sm text-gray-600">{size.description}</p>
                <p className="text-sm font-medium text-orange-600 mt-1">{formatCurrency(size.price)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingSize(size)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <i className="ri-edit-line"></i>
                </button>
                <button
                  onClick={() => handleDeleteSize(size.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">
          {editingSize ? 'Edit Size' : 'Add New Size'}
        </h4>
        <div className="space-y-4">
          <Input
            label="Size Name"
            name="name"
            value={editingSize?.name || newSize.name}
            onChange={handleInputChange}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={editingSize?.description || newSize.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <Input
            label="Price"
            name="price"
            type="number"
            step="0.01"
            value={editingSize?.price || newSize.price}
            onChange={handleInputChange}
            required
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_default"
              checked={editingSize?.is_default || newSize.is_default}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Set as default size
            </label>
          </div>
        </div>
        <div className="flex space-x-3 mt-4">
          <Button
            onClick={editingSize ? handleUpdateSize : handleAddSize}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {editingSize ? 'Update Size' : 'Add Size'}
          </Button>
          {editingSize && (
            <Button
              onClick={() => setEditingSize(null)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
