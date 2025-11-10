import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ImageUpload from '../common/ImageUpload';

const EventForm = ({ initialData, onSubmit, isSubmitting, submitButtonText }) => {
  const [formData, setFormData] = useState(initialData);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [imageData, setImageData] = useState(null);
  const [price, setPrice] = useState(initialData?.price || 0); // price in INR (rupees)
  // Today's date string in YYYY-MM-DD used to restrict past dates
  const todayStr = new Date().toISOString().split('T')[0];

  // Initialize image data and price when component mounts or initialData changes
  useEffect(() => {
    setFormData(initialData);
    // If there's an existing image URL, set it properly
    if (initialData.image) {
      setImageData({ url: initialData.image });
    }
    if (initialData.price !== undefined && initialData.price !== null) {
      // Ensure stored price is a whole rupee amount
      const intPrice = Math.floor(Number(initialData.price) || 0);
      setPrice(intPrice);
      setFormData(prev => ({ ...prev, price: intPrice }));
    }
  }, [initialData]);

  // Debug useEffect
  useEffect(() => {
    console.log('Form data updated:', formData);
    console.log('Image data updated:', imageData);
  }, [formData, imageData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    // Add console logging to debug
    console.log('Time value:', formData.time, typeof formData.time);

    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Do not allow creating events on previous days (before today). Today's date is allowed.
    if (formData.date) {
      try {
        const selected = new Date(formData.date);
        const today = new Date();
        // Normalize both to midnight for date-only comparison
        selected.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        if (selected < today) {
          newErrors.date = 'Date cannot be in the past';
        }
      } catch (e) {
        newErrors.date = 'Invalid date';
      }
    }

    // More robust time validation
    if (!formData.time || formData.time === '' || !formData.hour || !formData.minute) {
      newErrors.time = 'Time is required';
    }

    if (!formData.location || !formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }

    // Price validation: must be a non-negative integer representing whole rupees
    const priceVal = Number(price);
    if (Number.isNaN(priceVal) || !Number.isInteger(priceVal) || priceVal < 0) {
      newErrors.price = 'Price must be a whole number (rupees) and cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Current formData:', formData);
    console.log('Current imageData:', imageData);
    
    if (validateForm()) {
      // Ensure tags is always an array and sanitize image placeholders
      const safeTags = Array.isArray(formData.tags) ? formData.tags : [];
      const imageVal = imageData && imageData.url ? imageData.url : (formData.image && formData.image !== 'NO IMAGE PROVIDED' ? formData.image : '');

      // Include image data and price in form submission
      const submissionData = {
        ...formData,
        tags: safeTags,
        imageData: imageData,
        image: imageVal,
        // Ensure price is stored as whole rupees (integer)
        price: Math.max(0, parseInt(Number(price) || 0, 10))
      };
      
      console.log('=== CALLING onSubmit WITH DATA ===');
      console.log('Submission data:', submissionData);
      
      onSubmit(submissionData);
    } else {
      console.log('=== FORM VALIDATION FAILED ===');
      console.log('Errors:', errors);
    }
  };
  
  const handleImageUpload = (uploadedImageData) => {
    setImageData(uploadedImageData);
    setFormData({
      ...formData,
      image: uploadedImageData.url
    });
  };

  const handleImageRemove = () => {
    setImageData(null);
    setFormData({
      ...formData,
      image: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
        {/* Title */}
        <div className="sm:col-span-4">
          <label htmlFor="title" className="block text-sm font-medium text-white/90">
            Event Title *
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] block w-full sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md px-3 py-2 bg-[rgba(255,255,255,0.02)] text-white/90 ${errors.title ? 'border-red-400' : ''}`}
              placeholder="Tech Conference 2023"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-white/90">
            Description *
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] block w-full sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md px-3 py-2 bg-[rgba(255,255,255,0.02)] text-white/90 ${errors.description ? 'border-red-400' : ''}`}
              placeholder="Provide a detailed description of your event"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Provide details about what attendees can expect, topics covered, speakers, etc.
          </p>
        </div>

        {/* Date and Time */}
        <div className="sm:col-span-3">
          <label htmlFor="date" className="block text-sm font-medium text-white/90">
            Date *
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="date"
              id="date"
              value={formData.date}
              min={todayStr}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] block w-full sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md px-3 py-2 bg-[rgba(255,255,255,0.02)] text-white/90 ${errors.date ? 'border-red-400' : ''}`}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>
        </div>

       
        <div className="sm:col-span-3">
          <label htmlFor="time" className="block text-sm font-medium text-white/90">
            Time *
          </label>
          <div className="mt-1">
            <select
              name="hour"
              value={formData.hour || ''}
              onChange={(e) => {
                const hour = e.target.value;
                const minute = formData.minute || '00';
                setFormData({
                  ...formData,
                  hour,
                  time: `${hour}:${minute}`
                });
                // Clear error for this field if it exists
                if (errors.time) {
                  setErrors({
                    ...errors,
                    time: ''
                  });
                }
              }}
              className="mr-2 shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md bg-[rgba(255,255,255,0.02)] text-white/90"
            >
              <option value="">Hour</option>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return <option key={hour} value={hour}>{hour}</option>;
              })}
            </select>
            :
            <select
              name="minute"
              value={formData.minute || ''}
              onChange={(e) => {
                const minute = e.target.value;
                const hour = formData.hour || '00';
                setFormData({
                  ...formData,
                  minute,
                  time: `${hour}:${minute}`
                });
                // Clear error for this field if it exists
                if (errors.time) {
                  setErrors({
                    ...errors,
                    time: ''
                  });
                }
              }}
              className="ml-2 shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md bg-[rgba(255,255,255,0.02)] text-white/90"
            >
              <option value="">Min</option>
              {Array.from({ length: 60 }, (_, i) => {
                const minute = i.toString().padStart(2, '0');
                return <option key={minute} value={minute}>{minute}</option>;
              })}
            </select>
            {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="sm:col-span-6">
          <label htmlFor="location" className="block text-sm font-medium text-white/90">
            Location *
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] block w-full sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md px-3 py-2 bg-[rgba(255,255,255,0.02)] text-white/90 ${errors.location ? 'border-red-400' : ''}`}
              placeholder="Building name, room number, address, or online platform"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>
        </div>

        {/* Capacity */}
        <div className="sm:col-span-2">
          <label htmlFor="capacity" className="block text-sm font-medium text-white/90">
            Capacity *
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="capacity"
              id="capacity"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              className={`shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] block w-full sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md px-3 py-2 bg-[rgba(255,255,255,0.02)] text-white/90 ${errors.capacity ? 'border-red-400' : ''}`}
            />
            {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Maximum number of attendees
          </p>
        </div>

        {/* Tags */}
        <div className="sm:col-span-6">
          <label htmlFor="tags" className="block text-sm font-medium text-white/90">
            Tags (Optional)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              name="tagInput"
              id="tagInput"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyPress={handleTagKeyPress}
              className="focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] flex-1 block w-full rounded-none rounded-l-md sm:text-sm border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] text-white/90 px-3 py-2"
              placeholder="Add tags (e.g., technology, workshop, networking)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-[rgba(255,255,255,0.04)] rounded-r-md bg-[rgba(255,255,255,0.02)] text-white/80 sm:text-sm hover:bg-[rgba(255,255,255,0.03)]"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                  >
                    <span className="sr-only">Remove tag {tag}</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="sm:col-span-6">
          <ImageUpload
            onImageUpload={handleImageUpload}
            currentImage={formData.image}
            onImageRemove={handleImageRemove}
          />
        </div>

        {/* Price (INR) */}
        <div className="sm:col-span-2">
          <label htmlFor="price" className="block text-sm font-medium text-white/90">
            Price (INR)
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="price"
              id="price"
              step="1"
              min="0"
              value={price}
              onChange={(e) => {
                // Only allow whole rupee values (no paise). Coerce to integer.
                const raw = e.target.value;
                const intVal = raw === '' ? '' : Math.max(0, Math.floor(Number(raw) || 0));
                setPrice(intVal);
                setFormData({ ...formData, price: intVal });
                if (errors.price) setErrors({ ...errors, price: '' });
              }}
              className={`shadow-sm focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] block w-full sm:text-sm border border-[rgba(255,255,255,0.04)] rounded-md px-3 py-2 bg-[rgba(255,255,255,0.02)] text-white/90 ${errors.price ? 'border-red-400' : ''}`}
              placeholder="0"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>
          <p className="mt-2 text-sm text-gray-500">Enter price in whole Indian Rupees (no paise), e.g., 199</p>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-[var(--color-primary)] btn-accent ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : submitButtonText || 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
};

  EventForm.propTypes = {
  initialData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    image: PropTypes.string,
    price: PropTypes.number
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  submitButtonText: PropTypes.string
};

export default EventForm;