const requestContext = require("../../request.context");

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /** Ensure all queries include the companyDomain */
  getTenantFilter(additionalFilter = {}) {
    const companyDomain = requestContext.get("companyDomain");
    if (!companyDomain) {
      throw new Error({
        name: "CompanyDomainError",
        message: "Company domain missing",
      });
    }
    return { companyDomain, ...additionalFilter };
  }

  /** Find by ID with tenant scope */
  async findById(id, populate = []) {
    return await this.model
      .findOne(this.getTenantFilter({ _id: id }))
      .populate(populate);
  }

  /** Find multiple documents with optional pagination */
  async find(query = {}, skip = 0, limit = 10, populate = []) {
    return await this.model
      .find(this.getTenantFilter(query))
      .populate(populate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async aggregate(query, aggregateList) {
    const fullAggregateList = [
      { $match: this.getTenantFilter(query) },
      ...aggregateList,
    ];

    return await this.model.aggregate(fullAggregateList);
  }

  /** Count documents with tenant scope */
  async count(query = {}) {
    return await this.model.countDocuments(this.getTenantFilter(query));
  }

  /** Create a new document with companyDomain */
  async create(data) {
    const modelData = {
      ...data,
      companyDomain: requestContext.get("companyDomain"),
    };
    return await this.model.create(modelData);
  }

  /** Update document by ID */
  async updateById(id, update) {
    return await this.model.findOneAndUpdate(
      this.getTenantFilter({ _id: id }),
      update,
      { new: true, runValidators: true }
    );
  }

  async updateMany(filter, update) {
    return await this.model.updateMany(this.getTenantFilter(filter), update, {
      new: true,
    });
  }

  /** Delete documents by IDs */
  async deleteByIds(ids) {
    return await this.model.deleteMany(
      this.getTenantFilter({ _id: { $in: ids } })
    );
  }
}

module.exports = BaseRepository;
