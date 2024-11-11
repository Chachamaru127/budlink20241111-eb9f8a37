"use client"

import { useState } from 'react'
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'
import Image from 'next/image'

type ProductType = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  status: string
  manufacturerName: string
  rating: number
  category: string
}

type ProductCardProps = {
  product: ProductType
  onSelect: (product: ProductType) => void
}

const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  const [imgSrc, setImgSrc] = useState(product.imageUrl)

  const handleImageError = () => {
    setImgSrc('/images/product-placeholder.png')
  }

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '円'
  }

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <span key={index} data-testid="rating-star">
        {index < Math.floor(rating) ? (
          <AiFillStar className="text-yellow-400" />
        ) : (
          <AiOutlineStar className="text-gray-400" />
        )}
      </span>
    ))
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case '在庫切れ':
        return 'bg-red-500'
      case 'セール中':
        return 'bg-orange-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div
      data-testid="product-card"
      onClick={() => onSelect(product)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    >
      <div className="relative h-48">
        <Image
          src={imgSrc}
          alt={product.name}
          layout="fill"
          objectFit="cover"
          onError={handleImageError}
        />
        <div className={`absolute top-2 right-2 ${getStatusBadgeColor(product.status)} text-white px-2 py-1 rounded-full text-sm`}>
          {product.status}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.manufacturerName}</p>
        <p
          data-testid="product-description"
          className="text-sm text-gray-500 mb-2"
        >
          {truncateDescription(product.description)}
        </p>
        <div className="flex items-center mb-2">
          {renderRatingStars(product.rating)}
        </div>
        <div className="flex justify-between items-center">
          <span
            data-testid="product-price"
            className="text-lg font-bold text-blue-600"
          >
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-gray-500">在庫: {product.stock}</span>
        </div>
      </div>
    </div>
  )
}

export default ProductCard